/**
 * Asciistrator - XAML Layout Transformer
 * 
 * Transforms auto-layout properties to XAML layout panels
 * (StackPanel, DockPanel, Grid, WrapPanel) for Avalonia/WPF/MAUI.
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
// XAML PANEL TYPE SELECTION
// ==========================================

/**
 * XAML panel types that can represent auto-layout
 */
export const XAMLPanelType = {
    CANVAS: 'Canvas',           // Absolute positioning
    STACK_PANEL: 'StackPanel',  // Simple horizontal/vertical stack
    WRAP_PANEL: 'WrapPanel',    // Wrapping layout
    DOCK_PANEL: 'DockPanel',    // Docking layout
    GRID: 'Grid',               // Grid layout (for space-between, etc.)
    UNIFORM_GRID: 'UniformGrid' // Equal-sized grid cells
};

/**
 * XAML alignment values
 */
export const XAMLAlignment = {
    HORIZONTAL: {
        LEFT: 'Left',
        CENTER: 'Center',
        RIGHT: 'Right',
        STRETCH: 'Stretch'
    },
    VERTICAL: {
        TOP: 'Top',
        CENTER: 'Center',
        BOTTOM: 'Bottom',
        STRETCH: 'Stretch'
    }
};

// ==========================================
// XAML LAYOUT TRANSFORMER
// ==========================================

/**
 * XAML layout transformer for Avalonia/WPF/MAUI.
 * Converts auto-layout properties to appropriate XAML panels and attributes.
 */
export class XAMLLayoutTransformer extends LayoutExportEngine {
    constructor(options = {}) {
        super({
            unit: '',  // XAML uses unitless numbers (assumed pixels)
            // Target framework: 'avalonia', 'wpf', 'maui', 'uwp'
            framework: 'avalonia',
            // Prefer Grid over StackPanel for complex layouts
            preferGrid: false,
            // Use x:Name for elements
            generateNames: false,
            // Name prefix
            namePrefix: '',
            ...options
        });
        
        this._nameCounter = 0;
    }
    
    // ==========================================
    // PANEL TYPE SELECTION
    // ==========================================
    
    /**
     * Determine the best XAML panel type for layout properties
     * @param {LayoutProperties} props - Layout properties
     * @returns {string} Panel type name
     */
    selectPanelType(props) {
        if (!props.layoutMode || props.layoutMode === LayoutMode.NONE) {
            return XAMLPanelType.CANVAS;
        }
        
        // Wrapping layout = WrapPanel
        if (props.wrapMode === LayoutWrap.WRAP) {
            return XAMLPanelType.WRAP_PANEL;
        }
        
        // Space distribution modes work best with Grid
        const isSpaceDistribution = [
            PrimaryAxisAlign.SPACE_BETWEEN,
            PrimaryAxisAlign.SPACE_AROUND,
            PrimaryAxisAlign.SPACE_EVENLY
        ].includes(props.primaryAxisAlign);
        
        if (isSpaceDistribution || this.options.preferGrid) {
            return XAMLPanelType.GRID;
        }
        
        // Default to StackPanel for simple layouts
        return XAMLPanelType.STACK_PANEL;
    }
    
    // ==========================================
    // CONTAINER LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform layout properties to XAML panel attributes
     * @override
     * @param {LayoutProperties} props - Normalized layout properties
     * @param {Object} context - Export context
     * @returns {Object} { panelType, attributes, childWrapper }
     */
    transformContainerLayout(props, context = {}) {
        const panelType = this.selectPanelType(props);
        
        switch (panelType) {
            case XAMLPanelType.CANVAS:
                return this._transformCanvas(props, context);
            case XAMLPanelType.STACK_PANEL:
                return this._transformStackPanel(props, context);
            case XAMLPanelType.WRAP_PANEL:
                return this._transformWrapPanel(props, context);
            case XAMLPanelType.GRID:
                return this._transformGrid(props, context);
            default:
                return this._transformStackPanel(props, context);
        }
    }
    
    /**
     * Transform to Canvas (absolute positioning)
     * @private
     */
    _transformCanvas(props, context) {
        const attributes = {};
        
        // Size
        if (props.width > 0) {
            attributes.Width = this.toPixels(props.width);
        }
        if (props.height > 0) {
            attributes.Height = this.toPixels(props.height, true);
        }
        
        // Clipping
        if (props.clipContent) {
            attributes.ClipToBounds = 'True';
        }
        
        return {
            panelType: XAMLPanelType.CANVAS,
            attributes,
            childWrapper: null,
            needsChildAttachedProps: true
        };
    }
    
    /**
     * Transform to StackPanel
     * @private
     */
    _transformStackPanel(props, context) {
        const isHorizontal = this.isHorizontalLayout(props.layoutMode);
        const attributes = {};
        
        // Orientation
        attributes.Orientation = isHorizontal ? 'Horizontal' : 'Vertical';
        
        // Alignment within parent (if nested)
        if (props.primaryAxisAlign !== PrimaryAxisAlign.MIN) {
            if (isHorizontal) {
                attributes.HorizontalAlignment = this._mapPrimaryAlignment(props.primaryAxisAlign);
            } else {
                attributes.VerticalAlignment = this._mapPrimaryAlignment(props.primaryAxisAlign, true);
            }
        }
        
        // Size
        if (props.sizing.horizontal === SizingMode.FIXED && props.width > 0) {
            attributes.Width = this.toPixels(props.width);
        }
        if (props.sizing.vertical === SizingMode.FIXED && props.height > 0) {
            attributes.Height = this.toPixels(props.height, true);
        }
        
        // Spacing - handled via child margins in XAML
        // WPF/Avalonia StackPanel doesn't have native spacing
        const spacing = props.itemSpacing || 0;
        
        // Clipping
        if (props.clipContent) {
            attributes.ClipToBounds = 'True';
        }
        
        return {
            panelType: XAMLPanelType.STACK_PANEL,
            attributes,
            spacing: spacing,
            isHorizontal,
            childWrapper: null,
            counterAxisAlign: props.counterAxisAlign
        };
    }
    
    /**
     * Transform to WrapPanel
     * @private
     */
    _transformWrapPanel(props, context) {
        const isHorizontal = this.isHorizontalLayout(props.layoutMode);
        const attributes = {};
        
        // Orientation
        attributes.Orientation = isHorizontal ? 'Horizontal' : 'Vertical';
        
        // Item dimensions (for uniform sizing in WrapPanel)
        if (props.itemSpacing > 0) {
            // WrapPanel in Avalonia has ItemWidth/ItemHeight for spacing
            // In WPF, we use margins on children
            if (this.options.framework === 'avalonia') {
                // Avalonia's WrapPanel doesn't have native spacing
                // Will be handled via margins
            }
        }
        
        // Size
        if (props.sizing.horizontal === SizingMode.FIXED && props.width > 0) {
            attributes.Width = this.toPixels(props.width);
        }
        if (props.sizing.vertical === SizingMode.FIXED && props.height > 0) {
            attributes.Height = this.toPixels(props.height, true);
        }
        
        // Clipping
        if (props.clipContent) {
            attributes.ClipToBounds = 'True';
        }
        
        return {
            panelType: XAMLPanelType.WRAP_PANEL,
            attributes,
            spacing: props.itemSpacing || 0,
            wrapSpacing: props.counterAxisSpacing || 0,
            isHorizontal,
            childWrapper: null,
            counterAxisAlign: props.counterAxisAlign
        };
    }
    
    /**
     * Transform to Grid (for space distribution and complex layouts)
     * @private
     */
    _transformGrid(props, context) {
        const isHorizontal = this.isHorizontalLayout(props.layoutMode);
        const attributes = {};
        const childCount = context.childCount || 0;
        
        // Generate row/column definitions for space distribution
        const definitions = this._generateGridDefinitions(props, childCount);
        
        // Size
        if (props.sizing.horizontal === SizingMode.FIXED && props.width > 0) {
            attributes.Width = this.toPixels(props.width);
        }
        if (props.sizing.vertical === SizingMode.FIXED && props.height > 0) {
            attributes.Height = this.toPixels(props.height, true);
        }
        
        // Clipping
        if (props.clipContent) {
            attributes.ClipToBounds = 'True';
        }
        
        return {
            panelType: XAMLPanelType.GRID,
            attributes,
            definitions,
            isHorizontal,
            childWrapper: null,
            primaryAxisAlign: props.primaryAxisAlign,
            counterAxisAlign: props.counterAxisAlign
        };
    }
    
    /**
     * Generate Grid row/column definitions
     * @private
     */
    _generateGridDefinitions(props, childCount) {
        if (childCount === 0) return { rows: [], columns: [] };
        
        const isHorizontal = this.isHorizontalLayout(props.layoutMode);
        const definitions = { rows: [], columns: [] };
        const spacing = props.itemSpacing || 0;
        
        // Generate definitions based on alignment mode
        const targetArray = isHorizontal ? definitions.columns : definitions.rows;
        
        switch (props.primaryAxisAlign) {
            case PrimaryAxisAlign.SPACE_BETWEEN:
                // Children get * sizing, no spacers
                for (let i = 0; i < childCount; i++) {
                    targetArray.push({ size: '*' });
                }
                break;
                
            case PrimaryAxisAlign.SPACE_AROUND:
                // Each child gets equal space with half-space at edges
                for (let i = 0; i < childCount; i++) {
                    targetArray.push({ size: '*' });
                }
                break;
                
            case PrimaryAxisAlign.SPACE_EVENLY:
                // Equal space between and at edges
                for (let i = 0; i < childCount; i++) {
                    targetArray.push({ size: '*' });
                }
                break;
                
            default:
                // Auto-sized children with spacing
                for (let i = 0; i < childCount; i++) {
                    if (i > 0 && spacing > 0) {
                        // Add spacer column/row
                        targetArray.push({ size: this.toPixels(spacing, !isHorizontal) });
                    }
                    targetArray.push({ size: 'Auto' });
                }
                break;
        }
        
        // Cross-axis is always single definition
        const crossArray = isHorizontal ? definitions.rows : definitions.columns;
        crossArray.push({ size: '*' });
        
        return definitions;
    }
    
    // ==========================================
    // CHILD LAYOUT TRANSFORMATION
    // ==========================================
    
    /**
     * Transform child sizing for XAML panel participation
     * @override
     * @param {LayoutProperties} childProps - Child's layout properties
     * @param {LayoutProperties} parentProps - Parent's layout properties
     * @param {Object} context - Export context
     * @returns {Object} { attributes, attachedProps }
     */
    transformChildLayout(childProps, parentProps, context = {}) {
        if (!parentProps || parentProps.layoutMode === LayoutMode.NONE) {
            return this._transformCanvasChild(childProps, context);
        }
        
        const panelType = this.selectPanelType(parentProps);
        
        switch (panelType) {
            case XAMLPanelType.CANVAS:
                return this._transformCanvasChild(childProps, context);
            case XAMLPanelType.STACK_PANEL:
                return this._transformStackPanelChild(childProps, parentProps, context);
            case XAMLPanelType.WRAP_PANEL:
                return this._transformWrapPanelChild(childProps, parentProps, context);
            case XAMLPanelType.GRID:
                return this._transformGridChild(childProps, parentProps, context);
            default:
                return this._transformStackPanelChild(childProps, parentProps, context);
        }
    }
    
    /**
     * Transform Canvas child (absolute positioning)
     * @private
     */
    _transformCanvasChild(childProps, context) {
        const attachedProps = {};
        const attributes = {};
        
        // Canvas attached properties
        if (typeof childProps.computedX === 'number') {
            attachedProps['Canvas.Left'] = this.toPixels(childProps.computedX);
        } else if (typeof childProps.x === 'number') {
            attachedProps['Canvas.Left'] = this.toPixels(childProps.x);
        }
        
        if (typeof childProps.computedY === 'number') {
            attachedProps['Canvas.Top'] = this.toPixels(childProps.computedY, true);
        } else if (typeof childProps.y === 'number') {
            attachedProps['Canvas.Top'] = this.toPixels(childProps.y, true);
        }
        
        // Size
        if (childProps.width > 0) {
            attributes.Width = this.toPixels(childProps.width);
        }
        if (childProps.height > 0) {
            attributes.Height = this.toPixels(childProps.height, true);
        }
        
        return { attributes, attachedProps };
    }
    
    /**
     * Transform StackPanel child
     * @private
     */
    _transformStackPanelChild(childProps, parentProps, context) {
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        const attributes = {};
        const attachedProps = {};
        
        // Spacing via margin
        const spacing = parentProps.itemSpacing || 0;
        const childIndex = context.childIndex || 0;
        
        if (spacing > 0 && childIndex > 0) {
            if (isHorizontal) {
                attributes.Margin = `${this.toPixels(spacing)},0,0,0`;
            } else {
                attributes.Margin = `0,${this.toPixels(spacing, true)},0,0`;
            }
        }
        
        // Cross-axis alignment
        const crossAlign = parentProps.counterAxisAlign;
        if (isHorizontal) {
            attributes.VerticalAlignment = this._mapCounterAlignment(crossAlign);
        } else {
            attributes.HorizontalAlignment = this._mapCounterAlignment(crossAlign, true);
        }
        
        // Sizing
        const layoutSizing = childProps.layoutSizing || {};
        const mainAxisSizing = isHorizontal ? layoutSizing.horizontal : layoutSizing.vertical;
        const crossAxisSizing = isHorizontal ? layoutSizing.vertical : layoutSizing.horizontal;
        
        // Main axis fill - not directly supported in StackPanel
        // Would need Grid for true fill behavior
        
        // Cross axis fill/stretch
        if (crossAxisSizing === SizingMode.FILL || crossAlign === CounterAxisAlign.STRETCH) {
            if (isHorizontal) {
                attributes.VerticalAlignment = 'Stretch';
            } else {
                attributes.HorizontalAlignment = 'Stretch';
            }
        }
        
        // Fixed sizes
        if (childProps.width > 0 && layoutSizing.horizontal !== SizingMode.FILL) {
            attributes.Width = this.toPixels(childProps.width);
        }
        if (childProps.height > 0 && layoutSizing.vertical !== SizingMode.FILL) {
            attributes.Height = this.toPixels(childProps.height, true);
        }
        
        // Min/max constraints
        const sizing = childProps.sizing || {};
        if (sizing.minWidth != null) {
            attributes.MinWidth = this.toPixels(sizing.minWidth);
        }
        if (sizing.maxWidth != null) {
            attributes.MaxWidth = this.toPixels(sizing.maxWidth);
        }
        if (sizing.minHeight != null) {
            attributes.MinHeight = this.toPixels(sizing.minHeight, true);
        }
        if (sizing.maxHeight != null) {
            attributes.MaxHeight = this.toPixels(sizing.maxHeight, true);
        }
        
        return { attributes, attachedProps };
    }
    
    /**
     * Transform WrapPanel child
     * @private
     */
    _transformWrapPanelChild(childProps, parentProps, context) {
        // Similar to StackPanel but with margin for both axes
        const result = this._transformStackPanelChild(childProps, parentProps, context);
        
        const spacing = parentProps.itemSpacing || 0;
        const wrapSpacing = parentProps.counterAxisSpacing || 0;
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        
        // Apply margins for both spacing and wrap spacing
        if (spacing > 0 || wrapSpacing > 0) {
            const halfSpacing = this.toPixels(spacing / 2);
            const halfWrapSpacing = this.toPixels(wrapSpacing / 2, !isHorizontal);
            
            if (isHorizontal) {
                result.attributes.Margin = `${halfSpacing},${halfWrapSpacing},${halfSpacing},${halfWrapSpacing}`;
            } else {
                result.attributes.Margin = `${halfWrapSpacing},${halfSpacing},${halfWrapSpacing},${halfSpacing}`;
            }
        }
        
        return result;
    }
    
    /**
     * Transform Grid child
     * @private
     */
    _transformGridChild(childProps, parentProps, context) {
        const isHorizontal = this.isHorizontalLayout(parentProps.layoutMode);
        const attributes = {};
        const attachedProps = {};
        
        const childIndex = context.childIndex || 0;
        const primaryAlign = parentProps.primaryAxisAlign;
        
        // Grid row/column assignment
        const isSpaceDistribution = [
            PrimaryAxisAlign.SPACE_BETWEEN,
            PrimaryAxisAlign.SPACE_AROUND,
            PrimaryAxisAlign.SPACE_EVENLY
        ].includes(primaryAlign);
        
        if (isSpaceDistribution) {
            // Direct index mapping for space distribution
            if (isHorizontal) {
                attachedProps['Grid.Column'] = childIndex;
                attachedProps['Grid.Row'] = 0;
            } else {
                attachedProps['Grid.Row'] = childIndex;
                attachedProps['Grid.Column'] = 0;
            }
        } else {
            // Account for spacer columns/rows
            const spacing = parentProps.itemSpacing || 0;
            const gridIndex = spacing > 0 ? childIndex * 2 : childIndex;
            
            if (isHorizontal) {
                attachedProps['Grid.Column'] = gridIndex;
                attachedProps['Grid.Row'] = 0;
            } else {
                attachedProps['Grid.Row'] = gridIndex;
                attachedProps['Grid.Column'] = 0;
            }
        }
        
        // Alignment within grid cell
        if (primaryAlign === PrimaryAxisAlign.CENTER) {
            if (isHorizontal) {
                attributes.HorizontalAlignment = 'Center';
            } else {
                attributes.VerticalAlignment = 'Center';
            }
        }
        
        // Cross-axis alignment
        const crossAlign = parentProps.counterAxisAlign;
        if (isHorizontal) {
            attributes.VerticalAlignment = this._mapCounterAlignment(crossAlign);
        } else {
            attributes.HorizontalAlignment = this._mapCounterAlignment(crossAlign, true);
        }
        
        // Sizing
        const layoutSizing = childProps.layoutSizing || {};
        const mainAxisSizing = isHorizontal ? layoutSizing.horizontal : layoutSizing.vertical;
        
        // Fill behavior in Grid
        if (mainAxisSizing === SizingMode.FILL) {
            if (isHorizontal) {
                attributes.HorizontalAlignment = 'Stretch';
            } else {
                attributes.VerticalAlignment = 'Stretch';
            }
        }
        
        // Fixed sizes
        if (childProps.width > 0 && layoutSizing.horizontal !== SizingMode.FILL) {
            attributes.Width = this.toPixels(childProps.width);
        }
        if (childProps.height > 0 && layoutSizing.vertical !== SizingMode.FILL) {
            attributes.Height = this.toPixels(childProps.height, true);
        }
        
        return { attributes, attachedProps };
    }
    
    // ==========================================
    // CONSTRAINTS TRANSFORMATION
    // ==========================================
    
    /**
     * Transform constraints to XAML positioning
     * @override
     */
    transformConstraints(constraints, parentBounds, childBounds) {
        // In XAML, constraints are typically handled via:
        // 1. Alignment properties (HorizontalAlignment, VerticalAlignment)
        // 2. Canvas attached properties
        // 3. Grid row/column definitions
        
        const attachedProps = {};
        const attributes = {};
        
        if (!constraints) return { attributes, attachedProps };
        
        // Horizontal constraint
        switch (constraints.horizontal) {
            case 'MIN':
                attributes.HorizontalAlignment = 'Left';
                break;
            case 'MAX':
                attributes.HorizontalAlignment = 'Right';
                break;
            case 'STRETCH':
                attributes.HorizontalAlignment = 'Stretch';
                break;
            case 'CENTER':
                attributes.HorizontalAlignment = 'Center';
                break;
            case 'SCALE':
                // Scale requires binding or manual calculation
                attributes.HorizontalAlignment = 'Stretch';
                break;
        }
        
        // Vertical constraint
        switch (constraints.vertical) {
            case 'MIN':
                attributes.VerticalAlignment = 'Top';
                break;
            case 'MAX':
                attributes.VerticalAlignment = 'Bottom';
                break;
            case 'STRETCH':
                attributes.VerticalAlignment = 'Stretch';
                break;
            case 'CENTER':
                attributes.VerticalAlignment = 'Center';
                break;
            case 'SCALE':
                // Scale requires binding or manual calculation
                attributes.VerticalAlignment = 'Stretch';
                break;
        }
        
        return { attributes, attachedProps };
    }
    
    // ==========================================
    // SPACING & PADDING TRANSFORMATION
    // ==========================================
    
    /**
     * Transform spacing to XAML
     * @override
     */
    transformSpacing(spacing, isCounterAxis = false) {
        if (spacing <= 0) return 0;
        return this.toPixels(spacing, isCounterAxis);
    }
    
    /**
     * Transform padding to XAML Thickness
     * @override
     * @param {Object} padding - { left, right, top, bottom }
     * @returns {string} XAML Thickness value
     */
    transformPadding(padding) {
        if (!padding) return null;
        
        const left = this.toPixels(padding.left || 0);
        const top = this.toPixels(padding.top || 0, true);
        const right = this.toPixels(padding.right || 0);
        const bottom = this.toPixels(padding.bottom || 0, true);
        
        // Optimize output
        if (left === right && top === bottom) {
            if (left === top) {
                return left === 0 ? null : left.toString();
            }
            return `${left},${top}`;
        }
        
        return `${left},${top},${right},${bottom}`;
    }
    
    // ==========================================
    // ALIGNMENT MAPPING
    // ==========================================
    
    /**
     * Map primary axis alignment to XAML alignment
     * @private
     */
    _mapPrimaryAlignment(align, isVertical = false) {
        const map = isVertical ? {
            [PrimaryAxisAlign.MIN]: 'Top',
            [PrimaryAxisAlign.CENTER]: 'Center',
            [PrimaryAxisAlign.MAX]: 'Bottom'
        } : {
            [PrimaryAxisAlign.MIN]: 'Left',
            [PrimaryAxisAlign.CENTER]: 'Center',
            [PrimaryAxisAlign.MAX]: 'Right'
        };
        
        return map[align] || (isVertical ? 'Top' : 'Left');
    }
    
    /**
     * Map counter axis alignment to XAML alignment
     * @private
     */
    _mapCounterAlignment(align, isHorizontal = false) {
        const map = isHorizontal ? {
            [CounterAxisAlign.MIN]: 'Left',
            [CounterAxisAlign.CENTER]: 'Center',
            [CounterAxisAlign.MAX]: 'Right',
            [CounterAxisAlign.STRETCH]: 'Stretch',
            [CounterAxisAlign.BASELINE]: 'Center' // No baseline in XAML alignment
        } : {
            [CounterAxisAlign.MIN]: 'Top',
            [CounterAxisAlign.CENTER]: 'Center',
            [CounterAxisAlign.MAX]: 'Bottom',
            [CounterAxisAlign.STRETCH]: 'Stretch',
            [CounterAxisAlign.BASELINE]: 'Center' // No baseline in XAML alignment
        };
        
        return map[align] || (isHorizontal ? 'Left' : 'Top');
    }
    
    // ==========================================
    // XAML GENERATION HELPERS
    // ==========================================
    
    /**
     * Generate XAML row definitions
     * @param {Array} definitions - Row definitions
     * @returns {string}
     */
    generateRowDefinitions(definitions) {
        if (!definitions || definitions.length === 0) return '';
        
        return definitions
            .map(def => `<RowDefinition Height="${def.size}"/>`)
            .join('\n    ');
    }
    
    /**
     * Generate XAML column definitions
     * @param {Array} definitions - Column definitions
     * @returns {string}
     */
    generateColumnDefinitions(definitions) {
        if (!definitions || definitions.length === 0) return '';
        
        return definitions
            .map(def => `<ColumnDefinition Width="${def.size}"/>`)
            .join('\n    ');
    }
    
    /**
     * Format attributes as XAML attribute string
     * @param {Object} attributes - Attribute object
     * @returns {string}
     */
    formatAttributes(attributes) {
        if (!attributes || Object.keys(attributes).length === 0) return '';
        
        return Object.entries(attributes)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
    }
    
    /**
     * Merge attributes and attached props
     * @param {Object} attributes - Regular attributes
     * @param {Object} attachedProps - Attached properties
     * @returns {string}
     */
    mergeAttributes(attributes, attachedProps) {
        const merged = { ...attributes, ...attachedProps };
        return this.formatAttributes(merged);
    }
    
    /**
     * Generate unique element name
     * @param {string} prefix - Name prefix
     * @returns {string}
     */
    generateName(prefix = '') {
        return `${this.options.namePrefix}${prefix}${++this._nameCounter}`;
    }
    
    /**
     * Reset state
     */
    reset() {
        this._nameCounter = 0;
    }
}

// ==========================================
// EXPORT
// ==========================================

export default XAMLLayoutTransformer;
