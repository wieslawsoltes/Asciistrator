/**
 * Core Layout Engine - Figma-style Auto Layout
 * 
 * This module provides a comprehensive layout system similar to Figma's auto layout,
 * supporting nested containers, flexible sizing, and hierarchical object management.
 */

// Layout direction constants
export const LayoutDirection = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
};

// Alignment constants (cross-axis)
export const LayoutAlignment = {
    START: 'start',
    CENTER: 'center',
    END: 'end',
    STRETCH: 'stretch',
    BASELINE: 'baseline'
};

// Distribution constants (main-axis)
export const LayoutDistribution = {
    PACKED: 'packed',
    SPACE_BETWEEN: 'space-between',
    SPACE_AROUND: 'space-around',
    SPACE_EVENLY: 'space-evenly'
};

// Sizing mode constants
export const SizingMode = {
    FIXED: 'fixed',
    HUG: 'hug',
    FILL: 'fill'
};

// Constraint constants for pinning
export const Constraints = {
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
    CENTER: 'center',
    SCALE: 'scale'
};

/**
 * Default auto layout configuration
 */
export const defaultAutoLayout = () => ({
    enabled: false,
    direction: LayoutDirection.VERTICAL,
    spacing: 1,
    padding: { top: 1, right: 1, bottom: 1, left: 1 },
    alignment: LayoutAlignment.START,
    distribution: LayoutDistribution.PACKED,
    wrap: false,
    wrapSpacing: 1,
    reversed: false
});

/**
 * Default sizing configuration
 */
export const defaultSizing = () => ({
    horizontal: SizingMode.FIXED,
    vertical: SizingMode.FIXED,
    minWidth: null,
    maxWidth: null,
    minHeight: null,
    maxHeight: null
});

/**
 * Default constraints configuration
 */
export const defaultConstraints = () => ({
    horizontal: Constraints.LEFT,
    vertical: Constraints.TOP
});

/**
 * Layout Engine - Calculates positions for children within a container
 */
export class LayoutEngine {
    /**
     * Calculate layout for children within a container
     * @param {Object} container - Container with autoLayout and sizing config
     * @param {Array} children - Array of child objects
     * @returns {Array} - Array of {object, x, y, width, height} for each child
     */
    static calculateLayout(container, children) {
        if (!container.autoLayout?.enabled || children.length === 0) {
            return children.map(child => ({
                object: child,
                x: child.x,
                y: child.y,
                width: child.width || 1,
                height: child.height || 1
            }));
        }

        const al = container.autoLayout;
        const padding = al.padding || { top: 1, right: 1, bottom: 1, left: 1 };
        const isHorizontal = al.direction === LayoutDirection.HORIZONTAL;
        
        // Content area
        const contentX = container.x + padding.left;
        const contentY = container.y + padding.top;
        const contentWidth = container.width - padding.left - padding.right;
        const contentHeight = container.height - padding.top - padding.bottom;
        
        // Get items in correct order
        const items = al.reversed ? [...children].reverse() : [...children];
        
        // Calculate item sizes
        const itemSizes = items.map(child => {
            const sizing = child._layoutSizing || defaultSizing();
            const bounds = child.getBounds ? child.getBounds() : 
                { width: child.width || 1, height: child.height || 1 };
            
            return {
                object: child,
                baseWidth: bounds.width,
                baseHeight: bounds.height,
                fillH: sizing.horizontal === SizingMode.FILL,
                fillV: sizing.vertical === SizingMode.FILL,
                minW: sizing.minWidth,
                maxW: sizing.maxWidth,
                minH: sizing.minHeight,
                maxH: sizing.maxHeight
            };
        });

        // Handle wrapping
        if (al.wrap) {
            return this._calculateWrappingLayout(
                contentX, contentY, contentWidth, contentHeight,
                itemSizes, al, isHorizontal
            );
        }

        // Single line/column layout
        return this._calculateLinearLayout(
            contentX, contentY, contentWidth, contentHeight,
            itemSizes, al, isHorizontal
        );
    }

    /**
     * Calculate linear (non-wrapping) layout
     */
    static _calculateLinearLayout(contentX, contentY, contentWidth, contentHeight, items, al, isHorizontal) {
        const mainAxisSize = isHorizontal ? contentWidth : contentHeight;
        const crossAxisSize = isHorizontal ? contentHeight : contentWidth;
        
        // Calculate total fixed size and fill count
        let totalFixedSize = 0;
        let fillCount = 0;
        
        for (const item of items) {
            const isFill = isHorizontal ? item.fillH : item.fillV;
            const size = isHorizontal ? item.baseWidth : item.baseHeight;
            
            if (!isFill) {
                totalFixedSize += size;
            } else {
                fillCount++;
            }
        }
        
        // Calculate spacing
        const totalSpacing = al.spacing * Math.max(0, items.length - 1);
        const availableForFill = mainAxisSize - totalFixedSize - totalSpacing;
        const fillSize = fillCount > 0 ? Math.max(1, Math.floor(availableForFill / fillCount)) : 0;
        
        // Calculate starting position based on distribution
        let mainPos = 0;
        let gap = al.spacing;
        
        if (al.distribution !== LayoutDistribution.PACKED) {
            const totalItemSize = items.reduce((sum, item) => {
                const isFill = isHorizontal ? item.fillH : item.fillV;
                return sum + (isFill ? fillSize : (isHorizontal ? item.baseWidth : item.baseHeight));
            }, 0);
            
            const remainingSpace = mainAxisSize - totalItemSize;
            
            switch (al.distribution) {
                case LayoutDistribution.SPACE_BETWEEN:
                    gap = items.length > 1 ? remainingSpace / (items.length - 1) : 0;
                    break;
                case LayoutDistribution.SPACE_AROUND:
                    gap = remainingSpace / items.length;
                    mainPos = gap / 2;
                    break;
                case LayoutDistribution.SPACE_EVENLY:
                    gap = remainingSpace / (items.length + 1);
                    mainPos = gap;
                    break;
            }
        } else {
            // Packed - apply alignment
            const totalSize = totalFixedSize + (fillCount * fillSize) + totalSpacing;
            switch (al.alignment) {
                case LayoutAlignment.CENTER:
                    mainPos = Math.floor((mainAxisSize - totalSize) / 2);
                    break;
                case LayoutAlignment.END:
                    mainPos = mainAxisSize - totalSize;
                    break;
            }
        }
        
        // Position items
        const results = [];
        
        for (const item of items) {
            const isFillMain = isHorizontal ? item.fillH : item.fillV;
            const isFillCross = isHorizontal ? item.fillV : item.fillH;
            
            let itemMainSize = isFillMain ? fillSize : (isHorizontal ? item.baseWidth : item.baseHeight);
            let itemCrossSize = isHorizontal ? item.baseHeight : item.baseWidth;
            
            // Apply min/max constraints
            if (isHorizontal) {
                if (item.minW !== null) itemMainSize = Math.max(item.minW, itemMainSize);
                if (item.maxW !== null) itemMainSize = Math.min(item.maxW, itemMainSize);
            } else {
                if (item.minH !== null) itemMainSize = Math.max(item.minH, itemMainSize);
                if (item.maxH !== null) itemMainSize = Math.min(item.maxH, itemMainSize);
            }
            
            // Cross axis positioning and stretching
            let crossPos = 0;
            
            if (al.alignment === LayoutAlignment.STRETCH || isFillCross) {
                itemCrossSize = crossAxisSize;
                crossPos = 0;
            } else {
                switch (al.alignment) {
                    case LayoutAlignment.CENTER:
                        crossPos = Math.floor((crossAxisSize - itemCrossSize) / 2);
                        break;
                    case LayoutAlignment.END:
                        crossPos = crossAxisSize - itemCrossSize;
                        break;
                    default: // START
                        crossPos = 0;
                }
            }
            
            results.push({
                object: item.object,
                x: isHorizontal ? contentX + mainPos : contentX + crossPos,
                y: isHorizontal ? contentY + crossPos : contentY + mainPos,
                width: isHorizontal ? itemMainSize : itemCrossSize,
                height: isHorizontal ? itemCrossSize : itemMainSize
            });
            
            mainPos += itemMainSize + gap;
        }
        
        return results;
    }

    /**
     * Calculate wrapping layout
     */
    static _calculateWrappingLayout(contentX, contentY, contentWidth, contentHeight, items, al, isHorizontal) {
        const mainAxisSize = isHorizontal ? contentWidth : contentHeight;
        const results = [];
        
        // Group items into lines
        const lines = [];
        let currentLine = [];
        let currentLineSize = 0;
        
        for (const item of items) {
            const itemSize = isHorizontal ? item.baseWidth : item.baseHeight;
            
            if (currentLine.length > 0 && currentLineSize + al.spacing + itemSize > mainAxisSize) {
                lines.push({ items: currentLine, size: currentLineSize });
                currentLine = [item];
                currentLineSize = itemSize;
            } else {
                if (currentLine.length > 0) currentLineSize += al.spacing;
                currentLine.push(item);
                currentLineSize += itemSize;
            }
        }
        if (currentLine.length > 0) {
            lines.push({ items: currentLine, size: currentLineSize });
        }
        
        // Position lines
        let crossPos = 0;
        
        for (const line of lines) {
            const lineMaxCross = Math.max(...line.items.map(item => 
                isHorizontal ? item.baseHeight : item.baseWidth
            ));
            
            let mainPos = 0;
            
            // Apply main axis alignment for the line
            switch (al.alignment) {
                case LayoutAlignment.CENTER:
                    mainPos = Math.floor((mainAxisSize - line.size) / 2);
                    break;
                case LayoutAlignment.END:
                    mainPos = mainAxisSize - line.size;
                    break;
            }
            
            for (const item of line.items) {
                const itemMainSize = isHorizontal ? item.baseWidth : item.baseHeight;
                const itemCrossSize = isHorizontal ? item.baseHeight : item.baseWidth;
                
                let itemCrossPos = crossPos;
                
                // Cross alignment within line
                switch (al.alignment) {
                    case LayoutAlignment.CENTER:
                        itemCrossPos = crossPos + Math.floor((lineMaxCross - itemCrossSize) / 2);
                        break;
                    case LayoutAlignment.END:
                        itemCrossPos = crossPos + lineMaxCross - itemCrossSize;
                        break;
                    case LayoutAlignment.STRETCH:
                        // Item stretches to line height
                        break;
                }
                
                results.push({
                    object: item.object,
                    x: isHorizontal ? contentX + mainPos : contentX + itemCrossPos,
                    y: isHorizontal ? contentY + itemCrossPos : contentY + mainPos,
                    width: isHorizontal ? itemMainSize : (al.alignment === LayoutAlignment.STRETCH ? lineMaxCross : itemCrossSize),
                    height: isHorizontal ? (al.alignment === LayoutAlignment.STRETCH ? lineMaxCross : itemCrossSize) : itemMainSize
                });
                
                mainPos += itemMainSize + al.spacing;
            }
            
            crossPos += lineMaxCross + al.wrapSpacing;
        }
        
        return results;
    }

    /**
     * Calculate container size to hug its contents
     */
    static calculateHugSize(container, children) {
        if (children.length === 0) {
            return { width: container.width, height: container.height };
        }
        
        const al = container.autoLayout || defaultAutoLayout();
        const padding = al.padding || { top: 1, right: 1, bottom: 1, left: 1 };
        const sizing = container.sizing || defaultSizing();
        
        let contentWidth = 0;
        let contentHeight = 0;
        
        if (al.enabled) {
            const isHorizontal = al.direction === LayoutDirection.HORIZONTAL;
            const spacing = al.spacing * Math.max(0, children.length - 1);
            
            if (isHorizontal) {
                contentWidth = children.reduce((sum, c) => sum + (c.width || 1), 0) + spacing;
                contentHeight = Math.max(...children.map(c => c.height || 1));
            } else {
                contentWidth = Math.max(...children.map(c => c.width || 1));
                contentHeight = children.reduce((sum, c) => sum + (c.height || 1), 0) + spacing;
            }
        } else {
            // Calculate bounding box of all children
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            for (const child of children) {
                const b = child.getBounds ? child.getBounds() : 
                    { x: child.x, y: child.y, width: child.width || 1, height: child.height || 1 };
                const relX = b.x - container.x - padding.left;
                const relY = b.y - container.y - padding.top;
                minX = Math.min(minX, relX);
                minY = Math.min(minY, relY);
                maxX = Math.max(maxX, relX + b.width);
                maxY = Math.max(maxY, relY + b.height);
            }
            
            contentWidth = maxX - Math.min(0, minX);
            contentHeight = maxY - Math.min(0, minY);
        }
        
        const newWidth = sizing.horizontal === SizingMode.HUG 
            ? contentWidth + padding.left + padding.right 
            : container.width;
        const newHeight = sizing.vertical === SizingMode.HUG 
            ? contentHeight + padding.top + padding.bottom 
            : container.height;
        
        return {
            width: Math.max(3, newWidth),
            height: Math.max(3, newHeight)
        };
    }
}

/**
 * Hierarchy Manager - Handles parent-child relationships and operations
 */
export class HierarchyManager {
    /**
     * Find the deepest object at a point, traversing the hierarchy
     * @param {Array} rootObjects - Top-level objects
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} excludeContext - Optional context to exclude from search
     * @returns {Object|null} - The deepest object at the point
     */
    static findObjectAtPoint(rootObjects, x, y, excludeContext = null) {
        // Search in reverse order (top to bottom in z-order)
        for (let i = rootObjects.length - 1; i >= 0; i--) {
            const obj = rootObjects[i];
            if (!obj.visible || obj.locked) continue;
            if (excludeContext && excludeContext.id === obj.id) continue;
            
            const result = this._findInObject(obj, x, y, excludeContext);
            if (result) return result;
        }
        return null;
    }

    static _findInObject(obj, x, y, excludeContext) {
        // Check children first (they render on top)
        if (obj.children && obj.children.length > 0) {
            for (let i = obj.children.length - 1; i >= 0; i--) {
                const child = obj.children[i];
                if (!child.visible || child.locked) continue;
                if (excludeContext && excludeContext.id === child.id) continue;
                
                const result = this._findInObject(child, x, y, excludeContext);
                if (result) return result;
            }
        }
        
        // Check this object
        if (obj.containsPoint && obj.containsPoint(x, y)) {
            return obj;
        }
        
        return null;
    }

    /**
     * Find potential drop target container at a point
     * @param {Array} rootObjects - Top-level objects
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} draggedObject - Object being dragged (to exclude)
     * @returns {Object|null} - Container that can accept the drop
     */
    static findDropTarget(rootObjects, x, y, draggedObject) {
        for (let i = rootObjects.length - 1; i >= 0; i--) {
            const obj = rootObjects[i];
            if (!obj.visible || obj.id === draggedObject.id) continue;
            
            const result = this._findDropTargetIn(obj, x, y, draggedObject);
            if (result) return result;
        }
        return null;
    }

    static _findDropTargetIn(obj, x, y, draggedObject) {
        // Can't drop into yourself or your descendants
        if (obj.id === draggedObject.id) return null;
        if (this.isDescendantOf(obj, draggedObject)) return null;
        
        // Check children first
        if (obj.children && obj.children.length > 0) {
            for (let i = obj.children.length - 1; i >= 0; i--) {
                const child = obj.children[i];
                if (!child.visible) continue;
                
                const result = this._findDropTargetIn(child, x, y, draggedObject);
                if (result) return result;
            }
        }
        
        // Check if this object can accept children
        if (obj.canContainChildren && obj.canContainChildren() && obj.containsPoint(x, y)) {
            return obj;
        }
        
        return null;
    }

    /**
     * Check if an object is a descendant of another
     */
    static isDescendantOf(potentialDescendant, ancestor) {
        if (!ancestor.children) return false;
        
        for (const child of ancestor.children) {
            if (child.id === potentialDescendant.id) return true;
            if (this.isDescendantOf(potentialDescendant, child)) return true;
        }
        
        return false;
    }

    /**
     * Get the path from root to an object
     * @param {Array} rootObjects - Top-level objects
     * @param {Object} target - Target object
     * @returns {Array} - Array of objects from root to target
     */
    static getObjectPath(rootObjects, target) {
        for (const root of rootObjects) {
            const path = this._findPath(root, target, [root]);
            if (path) return path;
        }
        return [];
    }

    static _findPath(current, target, path) {
        if (current.id === target.id) return path;
        
        if (current.children) {
            for (const child of current.children) {
                const result = this._findPath(child, target, [...path, child]);
                if (result) return result;
            }
        }
        
        return null;
    }

    /**
     * Calculate the insertion index for reordering
     * @param {Object} container - Container with auto layout
     * @param {number} x - Drop x coordinate
     * @param {number} y - Drop y coordinate
     * @param {Object} draggedObject - Object being dragged
     * @returns {number} - Index to insert at
     */
    static calculateInsertionIndex(container, x, y, draggedObject) {
        if (!container.children || container.children.length === 0) return 0;
        if (!container.autoLayout?.enabled) return container.children.length;
        
        const isHorizontal = container.autoLayout.direction === LayoutDirection.HORIZONTAL;
        const pos = isHorizontal ? x : y;
        
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child.id === draggedObject.id) continue;
            
            const childPos = isHorizontal ? child.x : child.y;
            const childSize = isHorizontal ? (child.width || 1) : (child.height || 1);
            const midPoint = childPos + childSize / 2;
            
            if (pos < midPoint) {
                return i;
            }
        }
        
        return container.children.length;
    }

    /**
     * Move an object to a new parent at a specific index
     */
    static reparentObject(object, newParent, index, scene) {
        // Remove from current parent
        if (object.parentId) {
            const currentParent = scene.findObjectById(object.parentId);
            if (currentParent && currentParent.children) {
                const idx = currentParent.children.findIndex(c => c.id === object.id);
                if (idx > -1) {
                    currentParent.children.splice(idx, 1);
                    // Recalculate parent layout
                    if (currentParent.autoLayout?.enabled) {
                        currentParent.layoutChildren?.();
                    }
                }
            }
        } else {
            // Remove from scene root
            scene.removeObject?.(object);
        }
        
        // Add to new parent
        if (newParent) {
            object.parentId = newParent.id;
            
            if (!newParent.children) newParent.children = [];
            
            // Calculate relative position
            object._layoutSizing = object._layoutSizing || defaultSizing();
            
            // Insert at index
            if (index >= 0 && index < newParent.children.length) {
                newParent.children.splice(index, 0, object);
            } else {
                newParent.children.push(object);
            }
            
            // Recalculate parent layout
            if (newParent.autoLayout?.enabled) {
                newParent.layoutChildren?.();
            }
        } else {
            // Add to scene root
            object.parentId = null;
            scene.addObject?.(object);
        }
    }
}

/**
 * Selection Context - Manages hierarchical selection state
 */
export class SelectionContext {
    constructor() {
        this.currentContainer = null;  // Current editing context (null = root)
        this.selectedObjects = [];
        this.breadcrumb = [];  // Path to current container
    }

    /**
     * Enter a container for editing
     */
    enterContainer(container, rootObjects) {
        if (!container) {
            this.currentContainer = null;
            this.breadcrumb = [];
            return;
        }
        
        this.currentContainer = container;
        this.breadcrumb = HierarchyManager.getObjectPath(rootObjects, container);
        this.selectedObjects = [];
    }

    /**
     * Exit current container, go to parent
     */
    exitContainer(rootObjects) {
        if (!this.currentContainer) return;
        
        if (this.breadcrumb.length > 1) {
            this.breadcrumb.pop();
            this.currentContainer = this.breadcrumb[this.breadcrumb.length - 1];
        } else {
            this.currentContainer = null;
            this.breadcrumb = [];
        }
        
        this.selectedObjects = [];
    }

    /**
     * Exit to root
     */
    exitToRoot() {
        this.currentContainer = null;
        this.breadcrumb = [];
        this.selectedObjects = [];
    }

    /**
     * Get objects at current level (children of current container or root)
     */
    getObjectsAtCurrentLevel(rootObjects) {
        if (this.currentContainer && this.currentContainer.children) {
            return this.currentContainer.children;
        }
        return rootObjects;
    }
}

export default {
    LayoutDirection,
    LayoutAlignment,
    LayoutDistribution,
    SizingMode,
    Constraints,
    defaultAutoLayout,
    defaultSizing,
    defaultConstraints,
    LayoutEngine,
    HierarchyManager,
    SelectionContext
};
