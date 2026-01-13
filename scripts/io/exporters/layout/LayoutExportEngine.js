/**
 * Asciistrator - Layout Export Engine
 * 
 * Abstract base class for transforming auto-layout properties to format-specific layouts.
 * Each export format implements its own transformer to map Figma-style auto-layout
 * to the target format's layout system (CSS flexbox, XAML StackPanel/Grid, etc.)
 * 
 * @version 1.0.0
 */

// ==========================================
// LAYOUT CONSTANTS
// ==========================================

/**
 * Layout mode enum matching internal format
 */
export const LayoutMode = {
    NONE: 'NONE',
    HORIZONTAL: 'HORIZONTAL',
    VERTICAL: 'VERTICAL'
};

/**
 * Primary axis alignment enum
 */
export const PrimaryAxisAlign = {
    MIN: 'MIN',
    CENTER: 'CENTER',
    MAX: 'MAX',
    SPACE_BETWEEN: 'SPACE_BETWEEN',
    SPACE_AROUND: 'SPACE_AROUND',
    SPACE_EVENLY: 'SPACE_EVENLY'
};

/**
 * Counter (cross) axis alignment enum
 */
export const CounterAxisAlign = {
    MIN: 'MIN',
    CENTER: 'CENTER',
    MAX: 'MAX',
    STRETCH: 'STRETCH',
    BASELINE: 'BASELINE'
};

/**
 * Layout wrap mode enum
 */
export const LayoutWrap = {
    NO_WRAP: 'NO_WRAP',
    WRAP: 'WRAP'
};

/**
 * Sizing mode enum
 */
export const SizingMode = {
    FIXED: 'fixed',
    HUG: 'hug',
    FILL: 'fill'
};

// ==========================================
// LAYOUT PROPERTIES INTERFACE
// ==========================================

/**
 * Normalized layout properties extracted from scene objects
 * @typedef {Object} LayoutProperties
 * @property {string} layoutMode - NONE, HORIZONTAL, VERTICAL
 * @property {string} primaryAxisAlign - MIN, CENTER, MAX, SPACE_BETWEEN, etc.
 * @property {string} counterAxisAlign - MIN, CENTER, MAX, STRETCH, BASELINE
 * @property {Object} padding - { left, right, top, bottom }
 * @property {number} itemSpacing - Gap between items on primary axis
 * @property {number} counterAxisSpacing - Gap between wrapped rows
 * @property {string} wrapMode - NO_WRAP, WRAP
 * @property {boolean} reverseOrder - Whether items are reversed
 * @property {Object} sizing - { horizontal, vertical, minWidth, maxWidth, minHeight, maxHeight }
 */

// ==========================================
// LAYOUT EXPORT ENGINE BASE CLASS
// ==========================================

/**
 * Abstract base class for layout transformation engines.
 * 
 * Each export format should create a subclass that implements the abstract methods
 * to transform auto-layout properties to the target format's layout system.
 */
export class LayoutExportEngine {
    constructor(options = {}) {
        this.options = {
            // Default unit for measurements
            unit: 'px',
            // Base character cell size (for ASCII to pixel conversion)
            cellWidth: 10,
            cellHeight: 18,
            // Include comments in output
            includeComments: true,
            // Optimize output (combine similar styles, etc.)
            optimize: true,
            ...options
        };
    }
    
    // ==========================================
    // LAYOUT ANALYSIS
    // ==========================================
    
    /**
     * Check if an object has auto-layout enabled
     * @param {Object} obj - Scene object
     * @returns {boolean}
     */
    hasAutoLayout(obj) {
        return obj && obj.layoutMode && obj.layoutMode !== LayoutMode.NONE;
    }
    
    /**
     * Check if an object is a container (can have children)
     * @param {Object} obj - Scene object
     * @returns {boolean}
     */
    isContainer(obj) {
        return obj && (
            obj.type === 'frame' ||
            obj.type === 'group' ||
            this.hasAutoLayout(obj) ||
            (obj.children && obj.children.length > 0)
        );
    }
    
    /**
     * Extract normalized layout properties from a scene object
     * @param {Object} obj - Scene object
     * @returns {LayoutProperties}
     */
    extractLayoutProperties(obj) {
        if (!obj) return this._createDefaultLayoutProperties();
        
        // Handle both Frame and SceneObject layout properties
        const padding = obj.padding || {
            left: obj.paddingLeft ?? 0,
            right: obj.paddingRight ?? 0,
            top: obj.paddingTop ?? 0,
            bottom: obj.paddingBottom ?? 0
        };
        
        // Normalize sizing
        const sizing = this._normalizeSizing(obj.sizing);
        
        // Normalize layout sizing for children
        const layoutSizing = obj._layoutSizing ? {
            horizontal: obj._layoutSizing.horizontal || SizingMode.FIXED,
            vertical: obj._layoutSizing.vertical || SizingMode.FIXED
        } : null;
        
        return {
            layoutMode: obj.layoutMode || LayoutMode.NONE,
            primaryAxisAlign: obj.primaryAxisAlignItems || PrimaryAxisAlign.MIN,
            counterAxisAlign: obj.counterAxisAlignItems || CounterAxisAlign.MIN,
            padding: {
                left: typeof padding.left === 'number' ? padding.left : 0,
                right: typeof padding.right === 'number' ? padding.right : 0,
                top: typeof padding.top === 'number' ? padding.top : 0,
                bottom: typeof padding.bottom === 'number' ? padding.bottom : 0
            },
            itemSpacing: obj.itemSpacing ?? 0,
            counterAxisSpacing: obj.counterAxisSpacing ?? 0,
            wrapMode: obj.layoutWrap || LayoutWrap.NO_WRAP,
            reverseOrder: obj.itemReverseZIndex || false,
            sizing,
            layoutSizing,
            // Raw dimensions
            width: obj.width || 0,
            height: obj.height || 0,
            // Constraints for responsive layouts
            constraints: obj.constraints || null,
            // Clipping
            clipContent: obj.clipContent || false
        };
    }
    
    /**
     * Normalize sizing object
     * @private
     */
    _normalizeSizing(sizing) {
        if (!sizing) {
            return {
                horizontal: SizingMode.FIXED,
                vertical: SizingMode.FIXED,
                minWidth: null,
                maxWidth: null,
                minHeight: null,
                maxHeight: null
            };
        }
        
        return {
            horizontal: sizing.horizontal || SizingMode.FIXED,
            vertical: sizing.vertical || SizingMode.FIXED,
            minWidth: sizing.minWidth ?? null,
            maxWidth: sizing.maxWidth ?? null,
            minHeight: sizing.minHeight ?? null,
            maxHeight: sizing.maxHeight ?? null
        };
    }
    
    /**
     * Create default layout properties
     * @private
     */
    _createDefaultLayoutProperties() {
        return {
            layoutMode: LayoutMode.NONE,
            primaryAxisAlign: PrimaryAxisAlign.MIN,
            counterAxisAlign: CounterAxisAlign.MIN,
            padding: { left: 0, right: 0, top: 0, bottom: 0 },
            itemSpacing: 0,
            counterAxisSpacing: 0,
            wrapMode: LayoutWrap.NO_WRAP,
            reverseOrder: false,
            sizing: this._normalizeSizing(null),
            layoutSizing: null,
            width: 0,
            height: 0,
            constraints: null,
            clipContent: false
        };
    }
    
    // ==========================================
    // ABSTRACT TRANSFORMATION METHODS
    // ==========================================
    
    /**
     * Transform layout properties to format-specific container styles/attributes
     * @abstract
     * @param {LayoutProperties} props - Normalized layout properties
     * @param {Object} context - Export context (parent info, depth, etc.)
     * @returns {Object} Format-specific layout representation
     */
    transformContainerLayout(props, context = {}) {
        throw new Error('LayoutExportEngine.transformContainerLayout must be implemented by subclass');
    }
    
    /**
     * Transform child sizing properties for layout participation
     * @abstract
     * @param {LayoutProperties} childProps - Child's layout properties
     * @param {LayoutProperties} parentProps - Parent's layout properties
     * @param {Object} context - Export context
     * @returns {Object} Format-specific child layout attributes
     */
    transformChildLayout(childProps, parentProps, context = {}) {
        throw new Error('LayoutExportEngine.transformChildLayout must be implemented by subclass');
    }
    
    /**
     * Transform constraints to format-specific positioning
     * @abstract
     * @param {Object} constraints - Constraint settings
     * @param {Object} parentBounds - Parent container bounds
     * @param {Object} childBounds - Child bounds
     * @returns {Object} Format-specific constraint representation
     */
    transformConstraints(constraints, parentBounds, childBounds) {
        throw new Error('LayoutExportEngine.transformConstraints must be implemented by subclass');
    }
    
    /**
     * Generate format-specific spacing/gap representation
     * @abstract
     * @param {number} spacing - Spacing value in character units
     * @param {boolean} isCounterAxis - Whether this is counter-axis spacing
     * @returns {*} Format-specific spacing value
     */
    transformSpacing(spacing, isCounterAxis = false) {
        throw new Error('LayoutExportEngine.transformSpacing must be implemented by subclass');
    }
    
    /**
     * Generate format-specific padding representation
     * @abstract
     * @param {Object} padding - { left, right, top, bottom }
     * @returns {*} Format-specific padding representation
     */
    transformPadding(padding) {
        throw new Error('LayoutExportEngine.transformPadding must be implemented by subclass');
    }
    
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    
    /**
     * Convert character units to target units
     * @param {number} chars - Value in character units
     * @param {boolean} isVertical - Whether this is a vertical measurement
     * @returns {string} Value with unit suffix
     */
    toTargetUnit(chars, isVertical = false) {
        const pixels = isVertical 
            ? chars * this.options.cellHeight 
            : chars * this.options.cellWidth;
        return `${pixels}${this.options.unit}`;
    }
    
    /**
     * Convert character units to pixels (no unit suffix)
     * @param {number} chars - Value in character units
     * @param {boolean} isVertical - Whether this is a vertical measurement
     * @returns {number} Value in pixels
     */
    toPixels(chars, isVertical = false) {
        return isVertical 
            ? chars * this.options.cellHeight 
            : chars * this.options.cellWidth;
    }
    
    /**
     * Check if layout mode is horizontal
     * @param {string} layoutMode
     * @returns {boolean}
     */
    isHorizontalLayout(layoutMode) {
        return layoutMode === LayoutMode.HORIZONTAL;
    }
    
    /**
     * Check if layout mode is vertical
     * @param {string} layoutMode
     * @returns {boolean}
     */
    isVerticalLayout(layoutMode) {
        return layoutMode === LayoutMode.VERTICAL;
    }
    
    /**
     * Get the main axis size property name
     * @param {string} layoutMode
     * @returns {string}
     */
    getMainAxisProperty(layoutMode) {
        return this.isHorizontalLayout(layoutMode) ? 'width' : 'height';
    }
    
    /**
     * Get the cross axis size property name
     * @param {string} layoutMode
     * @returns {string}
     */
    getCrossAxisProperty(layoutMode) {
        return this.isHorizontalLayout(layoutMode) ? 'height' : 'width';
    }
    
    /**
     * Calculate computed layout for children (resolve positions)
     * Useful for formats that need absolute positioning (SVG, etc.)
     * @param {Array} children - Child objects
     * @param {LayoutProperties} parentProps - Parent layout properties
     * @returns {Array} Children with computed x, y, width, height
     */
    computeLayoutPositions(children, parentProps) {
        if (!children || children.length === 0) return [];
        
        const layoutMode = parentProps.layoutMode;
        if (layoutMode === LayoutMode.NONE) {
            // No auto-layout - return original positions
            return children.map(child => ({
                ...child,
                computedX: child.x || 0,
                computedY: child.y || 0,
                computedWidth: child.width || 0,
                computedHeight: child.height || 0
            }));
        }
        
        const isHorizontal = this.isHorizontalLayout(layoutMode);
        const padding = parentProps.padding;
        const spacing = parentProps.itemSpacing;
        
        // Calculate content area
        const contentX = padding.left;
        const contentY = padding.top;
        const contentWidth = parentProps.width - padding.left - padding.right;
        const contentHeight = parentProps.height - padding.top - padding.bottom;
        
        // Handle wrap mode
        if (parentProps.wrapMode === LayoutWrap.WRAP) {
            return this._computeWrappedLayout(children, parentProps, {
                contentX, contentY, contentWidth, contentHeight
            });
        }
        
        // Single-row/column layout
        return this._computeLinearLayout(children, parentProps, {
            contentX, contentY, contentWidth, contentHeight
        });
    }
    
    /**
     * Compute linear (non-wrapped) layout positions
     * @private
     */
    _computeLinearLayout(children, parentProps, content) {
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        const spacing = parentProps.itemSpacing;
        const primaryAlign = parentProps.primaryAxisAlign;
        const counterAlign = parentProps.counterAxisAlign;
        
        const mainAxisSize = isHorizontal ? content.contentWidth : content.contentHeight;
        const crossAxisSize = isHorizontal ? content.contentHeight : content.contentWidth;
        
        // Calculate total size of fixed items
        let totalFixedSize = 0;
        let fillCount = 0;
        const itemSizes = children.map(child => {
            const props = this.extractLayoutProperties(child);
            const isFillMain = props.layoutSizing 
                ? (isHorizontal ? props.layoutSizing.horizontal : props.layoutSizing.vertical) === SizingMode.FILL
                : false;
            
            const mainSize = isHorizontal ? (child.width || 0) : (child.height || 0);
            
            if (!isFillMain) {
                totalFixedSize += mainSize;
            } else {
                fillCount++;
            }
            
            return {
                child,
                props,
                mainSize,
                crossSize: isHorizontal ? (child.height || 0) : (child.width || 0),
                isFillMain,
                isFillCross: props.layoutSizing 
                    ? (isHorizontal ? props.layoutSizing.vertical : props.layoutSizing.horizontal) === SizingMode.FILL
                    : false
            };
        });
        
        const totalSpacing = spacing * Math.max(0, children.length - 1);
        const availableForFill = mainAxisSize - totalFixedSize - totalSpacing;
        const fillSize = fillCount > 0 ? Math.max(0, availableForFill / fillCount) : 0;
        
        // Calculate starting position based on alignment
        let mainPos = 0;
        let gap = spacing;
        
        const isSpaceDistribution = ['SPACE_BETWEEN', 'SPACE_AROUND', 'SPACE_EVENLY'].includes(primaryAlign);
        
        if (isSpaceDistribution) {
            const totalItemSize = itemSizes.reduce((sum, item) => {
                return sum + (item.isFillMain ? fillSize : item.mainSize);
            }, 0);
            const remainingSpace = mainAxisSize - totalItemSize;
            
            switch (primaryAlign) {
                case 'SPACE_BETWEEN':
                    gap = children.length > 1 ? remainingSpace / (children.length - 1) : 0;
                    break;
                case 'SPACE_AROUND':
                    gap = remainingSpace / children.length;
                    mainPos = gap / 2;
                    break;
                case 'SPACE_EVENLY':
                    gap = remainingSpace / (children.length + 1);
                    mainPos = gap;
                    break;
            }
        } else {
            const totalSize = totalFixedSize + (fillCount * fillSize) + totalSpacing;
            switch (primaryAlign) {
                case 'CENTER':
                    mainPos = (mainAxisSize - totalSize) / 2;
                    break;
                case 'MAX':
                    mainPos = mainAxisSize - totalSize;
                    break;
            }
        }
        
        // Compute positions
        const result = [];
        const orderedItems = parentProps.reverseOrder ? [...itemSizes].reverse() : itemSizes;
        
        for (const item of orderedItems) {
            const itemMainSize = item.isFillMain ? fillSize : item.mainSize;
            let itemCrossSize = item.crossSize;
            
            // Cross axis positioning
            let crossPos = 0;
            const isStretch = counterAlign === 'STRETCH' || item.isFillCross;
            
            if (isStretch) {
                itemCrossSize = crossAxisSize;
            } else {
                switch (counterAlign) {
                    case 'CENTER':
                        crossPos = (crossAxisSize - itemCrossSize) / 2;
                        break;
                    case 'MAX':
                        crossPos = crossAxisSize - itemCrossSize;
                        break;
                }
            }
            
            result.push({
                ...item.child,
                computedX: content.contentX + (isHorizontal ? mainPos : crossPos),
                computedY: content.contentY + (isHorizontal ? crossPos : mainPos),
                computedWidth: isHorizontal ? itemMainSize : itemCrossSize,
                computedHeight: isHorizontal ? itemCrossSize : itemMainSize
            });
            
            mainPos += itemMainSize + gap;
        }
        
        return result;
    }
    
    /**
     * Compute wrapped layout positions
     * @private
     */
    _computeWrappedLayout(children, parentProps, content) {
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        const spacing = parentProps.itemSpacing;
        const wrapSpacing = parentProps.counterAxisSpacing;
        
        const mainAxisSize = isHorizontal ? content.contentWidth : content.contentHeight;
        
        // Build rows/columns
        const lines = [];
        let currentLine = [];
        let currentLineSize = 0;
        
        for (const child of children) {
            const mainSize = isHorizontal ? (child.width || 0) : (child.height || 0);
            
            if (currentLine.length > 0 && currentLineSize + spacing + mainSize > mainAxisSize) {
                lines.push(currentLine);
                currentLine = [child];
                currentLineSize = mainSize;
            } else {
                if (currentLine.length > 0) {
                    currentLineSize += spacing;
                }
                currentLine.push(child);
                currentLineSize += mainSize;
            }
        }
        
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        // Compute positions for each line
        const result = [];
        let crossPos = 0;
        
        for (const line of lines) {
            const lineChildren = this._computeLinearLayout(
                line,
                {
                    ...parentProps,
                    wrapMode: LayoutWrap.NO_WRAP
                },
                {
                    contentX: content.contentX,
                    contentY: content.contentY + (isHorizontal ? crossPos : 0),
                    contentWidth: isHorizontal ? content.contentWidth : content.contentWidth,
                    contentHeight: isHorizontal ? content.contentHeight : content.contentHeight
                }
            );
            
            // Adjust cross-axis position for wrapped lines
            for (const child of lineChildren) {
                if (isHorizontal) {
                    child.computedY += crossPos;
                } else {
                    child.computedX += crossPos;
                }
                result.push(child);
            }
            
            // Calculate max cross size for this line
            const maxCrossSize = Math.max(...line.map(c => 
                isHorizontal ? (c.height || 0) : (c.width || 0)
            ));
            crossPos += maxCrossSize + wrapSpacing;
        }
        
        return result;
    }
}

// ==========================================
// EXPORT
// ==========================================

export default LayoutExportEngine;
