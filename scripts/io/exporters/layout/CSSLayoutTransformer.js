/**
 * Asciistrator - CSS Layout Transformer
 * 
 * Transforms auto-layout properties to CSS flexbox with proper
 * alignment, spacing, and wrapping support.
 * 
 * @version 1.0.0
 */

import { 
    LayoutExportEngine, 
    LayoutMode, 
    PrimaryAxisAlign, 
    CounterAxisAlign,
    LayoutWrap,
    SizingMode 
} from './LayoutExportEngine.js';

// ==========================================
// CSS FLEXBOX MAPPINGS
// ==========================================

/**
 * Map primary axis alignment to CSS justify-content
 */
const JUSTIFY_CONTENT_MAP = {
    [PrimaryAxisAlign.MIN]: 'flex-start',
    [PrimaryAxisAlign.CENTER]: 'center',
    [PrimaryAxisAlign.MAX]: 'flex-end',
    [PrimaryAxisAlign.SPACE_BETWEEN]: 'space-between',
    [PrimaryAxisAlign.SPACE_AROUND]: 'space-around',
    [PrimaryAxisAlign.SPACE_EVENLY]: 'space-evenly'
};

/**
 * Map counter axis alignment to CSS align-items
 */
const ALIGN_ITEMS_MAP = {
    [CounterAxisAlign.MIN]: 'flex-start',
    [CounterAxisAlign.CENTER]: 'center',
    [CounterAxisAlign.MAX]: 'flex-end',
    [CounterAxisAlign.STRETCH]: 'stretch',
    [CounterAxisAlign.BASELINE]: 'baseline'
};

/**
 * Map layout wrap to CSS flex-wrap
 */
const FLEX_WRAP_MAP = {
    [LayoutWrap.NO_WRAP]: 'nowrap',
    [LayoutWrap.WRAP]: 'wrap'
};

// ==========================================
// CSS LAYOUT TRANSFORMER
// ==========================================

/**
 * CSS Flexbox layout transformer.
 * Converts auto-layout properties to CSS flexbox styles.
 */
export class CSSLayoutTransformer extends LayoutExportEngine {
    constructor(options = {}) {
        super({
            unit: 'px',
            // Use CSS custom properties for theming
            useCustomProperties: false,
            // Custom property prefix
            customPropertyPrefix: '--asc-',
            // Generate class names instead of inline styles
            generateClasses: false,
            // Class name prefix
            classPrefix: 'asc-',
            // Use gap instead of margins (modern CSS)
            useGap: true,
            // Include vendor prefixes
            vendorPrefixes: false,
            ...options
        });
        
        // Track generated classes for deduplication
        this._classCounter = 0;
        this._styleCache = new Map();
    }
    
    // ==========================================
    // CONTAINER LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform layout properties to CSS flexbox styles
     * @override
     * @param {LayoutProperties} props - Normalized layout properties
     * @param {Object} context - Export context
     * @returns {Object} { styles: Object, className: string|null }
     */
    transformContainerLayout(props, context = {}) {
        const styles = {};
        
        // No layout mode = absolute positioning container
        if (!props.layoutMode || props.layoutMode === LayoutMode.NONE) {
            styles.position = 'relative';
            return this._finalizeContainerStyles(styles, props, context);
        }
        
        // Flexbox container
        styles.display = 'flex';
        
        // Flex direction
        styles.flexDirection = this.isHorizontalLayout(props.layoutMode) ? 'row' : 'column';
        
        // Reverse order
        if (props.reverseOrder) {
            styles.flexDirection += '-reverse';
        }
        
        // Justify content (main axis)
        styles.justifyContent = JUSTIFY_CONTENT_MAP[props.primaryAxisAlign] || 'flex-start';
        
        // Align items (cross axis)
        styles.alignItems = ALIGN_ITEMS_MAP[props.counterAxisAlign] || 'flex-start';
        
        // Flex wrap
        styles.flexWrap = FLEX_WRAP_MAP[props.wrapMode] || 'nowrap';
        
        // Align content (for wrapped content)
        if (props.wrapMode === LayoutWrap.WRAP) {
            // Use same alignment for wrapped content
            styles.alignContent = styles.alignItems;
        }
        
        // Gap (spacing)
        if (this.options.useGap) {
            if (props.itemSpacing > 0) {
                const gap = this.toTargetUnit(props.itemSpacing);
                
                if (props.wrapMode === LayoutWrap.WRAP && props.counterAxisSpacing > 0) {
                    // Row gap and column gap differ
                    const crossGap = this.toTargetUnit(props.counterAxisSpacing, true);
                    if (this.isHorizontalLayout(props.layoutMode)) {
                        styles.gap = `${crossGap} ${gap}`;
                    } else {
                        styles.gap = `${gap} ${crossGap}`;
                    }
                } else {
                    styles.gap = gap;
                }
            }
        }
        
        return this._finalizeContainerStyles(styles, props, context);
    }
    
    /**
     * Finalize container styles with common properties
     * @private
     */
    _finalizeContainerStyles(styles, props, context) {
        // Padding
        const padding = this.transformPadding(props.padding);
        if (padding) {
            styles.padding = padding;
        }
        
        // Sizing
        const sizing = this._transformSizing(props);
        Object.assign(styles, sizing);
        
        // Clipping
        if (props.clipContent) {
            styles.overflow = 'hidden';
        }
        
        // Width/height if fixed
        if (props.width > 0 && props.sizing.horizontal === SizingMode.FIXED) {
            styles.width = this.toTargetUnit(props.width);
        }
        if (props.height > 0 && props.sizing.vertical === SizingMode.FIXED) {
            styles.height = this.toTargetUnit(props.height, true);
        }
        
        // Box sizing
        styles.boxSizing = 'border-box';
        
        // Generate class name if enabled
        let className = null;
        if (this.options.generateClasses) {
            className = this._generateClassName(styles);
        }
        
        return { styles, className };
    }
    
    // ==========================================
    // CHILD LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform child sizing for flexbox participation
     * @override
     * @param {LayoutProperties} childProps - Child's layout properties
     * @param {LayoutProperties} parentProps - Parent's layout properties
     * @param {Object} context - Export context
     * @returns {Object} { styles: Object, className: string|null }
     */
    transformChildLayout(childProps, parentProps, context = {}) {
        const styles = {};
        
        // No parent auto-layout - use absolute positioning
        if (!parentProps || parentProps.layoutMode === LayoutMode.NONE) {
            return this._transformAbsoluteChild(childProps, context);
        }
        
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        const layoutSizing = childProps.layoutSizing || {};
        
        // Flex grow/shrink based on sizing mode
        const mainAxisSizing = isHorizontal ? layoutSizing.horizontal : layoutSizing.vertical;
        const crossAxisSizing = isHorizontal ? layoutSizing.vertical : layoutSizing.horizontal;
        
        // Main axis: fill = flex-grow: 1
        if (mainAxisSizing === SizingMode.FILL) {
            styles.flexGrow = 1;
            styles.flexShrink = 1;
            styles.flexBasis = '0%';
        } else {
            styles.flexGrow = 0;
            styles.flexShrink = 0;
            
            // Use actual size as basis for fixed
            if (isHorizontal) {
                styles.flexBasis = childProps.width > 0 ? this.toTargetUnit(childProps.width) : 'auto';
            } else {
                styles.flexBasis = childProps.height > 0 ? this.toTargetUnit(childProps.height, true) : 'auto';
            }
        }
        
        // Cross axis: fill/stretch = align-self: stretch
        if (crossAxisSizing === SizingMode.FILL || parentProps.counterAxisAlign === CounterAxisAlign.STRETCH) {
            styles.alignSelf = 'stretch';
        }
        
        // Min/max constraints
        const sizing = childProps.sizing || {};
        if (sizing.minWidth != null) {
            styles.minWidth = this.toTargetUnit(sizing.minWidth);
        }
        if (sizing.maxWidth != null) {
            styles.maxWidth = this.toTargetUnit(sizing.maxWidth);
        }
        if (sizing.minHeight != null) {
            styles.minHeight = this.toTargetUnit(sizing.minHeight, true);
        }
        if (sizing.maxHeight != null) {
            styles.maxHeight = this.toTargetUnit(sizing.maxHeight, true);
        }
        
        // Fixed sizes when not fill
        if (mainAxisSizing !== SizingMode.FILL) {
            if (isHorizontal && childProps.width > 0) {
                styles.width = this.toTargetUnit(childProps.width);
            } else if (!isHorizontal && childProps.height > 0) {
                styles.height = this.toTargetUnit(childProps.height, true);
            }
        }
        
        if (crossAxisSizing !== SizingMode.FILL && styles.alignSelf !== 'stretch') {
            if (isHorizontal && childProps.height > 0) {
                styles.height = this.toTargetUnit(childProps.height, true);
            } else if (!isHorizontal && childProps.width > 0) {
                styles.width = this.toTargetUnit(childProps.width);
            }
        }
        
        // Generate class name if enabled
        let className = null;
        if (this.options.generateClasses) {
            className = this._generateClassName(styles);
        }
        
        return { styles, className };
    }
    
    /**
     * Transform absolutely positioned child
     * @private
     */
    _transformAbsoluteChild(childProps, context) {
        const styles = {
            position: 'absolute'
        };
        
        // Position based on constraints or direct position
        if (childProps.constraints) {
            Object.assign(styles, this.transformConstraints(
                childProps.constraints,
                context.parentBounds || {},
                { x: childProps.x || 0, y: childProps.y || 0, width: childProps.width || 0, height: childProps.height || 0 }
            ));
        } else {
            // Direct positioning
            if (typeof childProps.x === 'number') {
                styles.left = this.toTargetUnit(childProps.x);
            }
            if (typeof childProps.y === 'number') {
                styles.top = this.toTargetUnit(childProps.y, true);
            }
        }
        
        // Size
        if (childProps.width > 0) {
            styles.width = this.toTargetUnit(childProps.width);
        }
        if (childProps.height > 0) {
            styles.height = this.toTargetUnit(childProps.height, true);
        }
        
        return { styles, className: null };
    }
    
    // ==========================================
    // CONSTRAINTS TRANSFORMATION
    // ==========================================
    
    /**
     * Transform constraints to CSS positioning
     * @override
     * @param {Object} constraints - { horizontal, vertical }
     * @param {Object} parentBounds - Parent container bounds
     * @param {Object} childBounds - Child bounds
     * @returns {Object} CSS positioning styles
     */
    transformConstraints(constraints, parentBounds, childBounds) {
        const styles = {};
        
        if (!constraints) return styles;
        
        // Horizontal constraint
        switch (constraints.horizontal) {
            case 'MIN':
                styles.left = this.toTargetUnit(childBounds.x);
                break;
            case 'MAX':
                styles.right = this.toTargetUnit(parentBounds.width - childBounds.x - childBounds.width);
                break;
            case 'STRETCH':
                styles.left = this.toTargetUnit(childBounds.x);
                styles.right = this.toTargetUnit(parentBounds.width - childBounds.x - childBounds.width);
                delete styles.width; // Width determined by left/right
                break;
            case 'CENTER':
                styles.left = '50%';
                styles.transform = (styles.transform || '') + ' translateX(-50%)';
                styles.marginLeft = this.toTargetUnit(childBounds.x - parentBounds.width / 2 + childBounds.width / 2);
                break;
            case 'SCALE':
                styles.left = `${(childBounds.x / parentBounds.width) * 100}%`;
                styles.width = `${(childBounds.width / parentBounds.width) * 100}%`;
                break;
        }
        
        // Vertical constraint
        switch (constraints.vertical) {
            case 'MIN':
                styles.top = this.toTargetUnit(childBounds.y, true);
                break;
            case 'MAX':
                styles.bottom = this.toTargetUnit(parentBounds.height - childBounds.y - childBounds.height, true);
                break;
            case 'STRETCH':
                styles.top = this.toTargetUnit(childBounds.y, true);
                styles.bottom = this.toTargetUnit(parentBounds.height - childBounds.y - childBounds.height, true);
                delete styles.height; // Height determined by top/bottom
                break;
            case 'CENTER':
                styles.top = '50%';
                styles.transform = (styles.transform || '') + ' translateY(-50%)';
                styles.marginTop = this.toTargetUnit(childBounds.y - parentBounds.height / 2 + childBounds.height / 2, true);
                break;
            case 'SCALE':
                styles.top = `${(childBounds.y / parentBounds.height) * 100}%`;
                styles.height = `${(childBounds.height / parentBounds.height) * 100}%`;
                break;
        }
        
        // Clean up transform
        if (styles.transform) {
            styles.transform = styles.transform.trim();
        }
        
        return styles;
    }
    
    // ==========================================
    // SPACING & PADDING TRANSFORMATION
    // ==========================================
    
    /**
     * Transform spacing to CSS
     * @override
     * @param {number} spacing - Spacing value in character units
     * @param {boolean} isCounterAxis - Whether this is counter-axis spacing
     * @returns {string} CSS spacing value
     */
    transformSpacing(spacing, isCounterAxis = false) {
        if (spacing <= 0) return '0';
        return this.toTargetUnit(spacing, isCounterAxis);
    }
    
    /**
     * Transform padding to CSS
     * @override
     * @param {Object} padding - { left, right, top, bottom }
     * @returns {string|null} CSS padding value
     */
    transformPadding(padding) {
        if (!padding) return null;
        
        const top = this.toTargetUnit(padding.top || 0, true);
        const right = this.toTargetUnit(padding.right || 0);
        const bottom = this.toTargetUnit(padding.bottom || 0, true);
        const left = this.toTargetUnit(padding.left || 0);
        
        // Optimize padding output
        if (top === bottom && left === right) {
            if (top === left) {
                return top === '0px' ? null : top;
            }
            return `${top} ${left}`;
        }
        
        return `${top} ${right} ${bottom} ${left}`;
    }
    
    // ==========================================
    // SIZING TRANSFORMATION
    // ==========================================
    
    /**
     * Transform sizing properties to CSS
     * @private
     */
    _transformSizing(props) {
        const styles = {};
        const sizing = props.sizing || {};
        
        // Hug content
        if (sizing.horizontal === SizingMode.HUG) {
            styles.width = 'fit-content';
        }
        if (sizing.vertical === SizingMode.HUG) {
            styles.height = 'fit-content';
        }
        
        // Min/max constraints
        if (sizing.minWidth != null) {
            styles.minWidth = this.toTargetUnit(sizing.minWidth);
        }
        if (sizing.maxWidth != null) {
            styles.maxWidth = this.toTargetUnit(sizing.maxWidth);
        }
        if (sizing.minHeight != null) {
            styles.minHeight = this.toTargetUnit(sizing.minHeight, true);
        }
        if (sizing.maxHeight != null) {
            styles.maxHeight = this.toTargetUnit(sizing.maxHeight, true);
        }
        
        return styles;
    }
    
    // ==========================================
    // STYLE OUTPUT
    // ==========================================
    
    /**
     * Convert styles object to CSS string
     * @param {Object} styles - Style object
     * @returns {string} CSS style string
     */
    stylesToString(styles) {
        if (!styles || Object.keys(styles).length === 0) return '';
        
        return Object.entries(styles)
            .map(([prop, value]) => {
                const cssProp = this._camelToDash(prop);
                return `${cssProp}: ${value}`;
            })
            .join('; ');
    }
    
    /**
     * Convert styles object to CSS declaration block
     * @param {Object} styles - Style object
     * @param {string} selector - CSS selector
     * @param {number} indent - Indentation level
     * @returns {string} CSS declaration block
     */
    stylesToBlock(styles, selector, indent = 0) {
        if (!styles || Object.keys(styles).length === 0) return '';
        
        const indentStr = '  '.repeat(indent);
        const innerIndent = '  '.repeat(indent + 1);
        
        const declarations = Object.entries(styles)
            .map(([prop, value]) => {
                const cssProp = this._camelToDash(prop);
                return `${innerIndent}${cssProp}: ${value};`;
            })
            .join('\n');
        
        return `${indentStr}${selector} {\n${declarations}\n${indentStr}}`;
    }
    
    /**
     * Generate unique class name for styles
     * @private
     */
    _generateClassName(styles) {
        // Create a hash of styles for deduplication
        const styleKey = JSON.stringify(styles);
        
        if (this._styleCache.has(styleKey)) {
            return this._styleCache.get(styleKey);
        }
        
        const className = `${this.options.classPrefix}${++this._classCounter}`;
        this._styleCache.set(styleKey, className);
        
        return className;
    }
    
    /**
     * Get all generated classes
     * @returns {Map<string, string>} Map of class names to style keys
     */
    getGeneratedClasses() {
        const result = new Map();
        
        for (const [styleKey, className] of this._styleCache) {
            result.set(className, JSON.parse(styleKey));
        }
        
        return result;
    }
    
    /**
     * Generate CSS stylesheet from generated classes
     * @returns {string}
     */
    generateStylesheet() {
        const blocks = [];
        
        for (const [styleKey, className] of this._styleCache) {
            const styles = JSON.parse(styleKey);
            blocks.push(this.stylesToBlock(styles, `.${className}`));
        }
        
        return blocks.join('\n\n');
    }
    
    /**
     * Reset class generation state
     */
    reset() {
        this._classCounter = 0;
        this._styleCache.clear();
    }
    
    /**
     * Convert camelCase to dash-case
     * @private
     */
    _camelToDash(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }
}

// ==========================================
// EXPORT
// ==========================================

export default CSSLayoutTransformer;
