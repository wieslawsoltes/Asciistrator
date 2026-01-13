/**
 * Asciistrator - XAML Layout Transformer
 * 
 * Transforms auto-layout properties to XAML layout panels
 * (StackPanel, DockPanel, Grid, WrapPanel) for Avalonia/WPF/MAUI.
 * 
 * Supports:
 * - Avalonia 11 Spacing property for StackPanel
 * - Grid with star/auto sizing
 * - DockPanel for dock-based layouts
 * - UniformGrid for equal-sized cells
 * - All alignment and sizing options
 * 
 * @version 2.0.0
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
    UNIFORM_GRID: 'UniformGrid', // Equal-sized grid cells
    RELATIVE_PANEL: 'RelativePanel', // Constraint-based layout
    ITEMS_REPEATER: 'ItemsRepeater' // Virtualized list
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

/**
 * Framework feature support
 */
export const FrameworkFeatures = {
    avalonia: {
        hasStackPanelSpacing: true,       // Avalonia 11+
        hasWrapPanelSpacing: false,       // Not yet
        hasDockPanelLastFill: true,
        hasUniformGrid: true,
        hasRelativePanel: false,
        supportsRenderTransform: true,
        supportsDropShadow: true,
        supportsBlur: true,
        supportsOpacityMask: true,
        supportsBorder: true,
        supportsClipping: true,
        hasBoxShadow: false,              // Use DropShadowEffect
        gridLengthSeparator: ','          // Avalonia uses comma
    },
    wpf: {
        hasStackPanelSpacing: false,      // WPF doesn't have Spacing
        hasWrapPanelSpacing: false,
        hasDockPanelLastFill: true,
        hasUniformGrid: true,
        hasRelativePanel: false,
        supportsRenderTransform: true,
        supportsDropShadow: true,
        supportsBlur: true,
        supportsOpacityMask: true,
        supportsBorder: true,
        supportsClipping: true,
        hasBoxShadow: false,
        gridLengthSeparator: ','
    },
    maui: {
        hasStackPanelSpacing: true,       // MAUI StackLayout has Spacing
        hasWrapPanelSpacing: false,       // FlexLayout needed
        hasDockPanelLastFill: false,      // No DockPanel in MAUI
        hasUniformGrid: false,            // Use Grid with uniform columns
        hasRelativePanel: false,
        supportsRenderTransform: true,
        supportsDropShadow: true,
        supportsBlur: false,              // Limited
        supportsOpacityMask: false,
        supportsBorder: true,
        supportsClipping: true,
        hasBoxShadow: true,               // Shadow attached property
        gridLengthSeparator: ','
    },
    uwp: {
        hasStackPanelSpacing: true,       // UWP has Spacing
        hasWrapPanelSpacing: false,
        hasDockPanelLastFill: false,
        hasUniformGrid: false,            // VariableSizedWrapGrid instead
        hasRelativePanel: true,           // UWP has RelativePanel
        supportsRenderTransform: true,
        supportsDropShadow: true,
        supportsBlur: true,
        supportsOpacityMask: true,
        supportsBorder: true,
        supportsClipping: true,
        hasBoxShadow: false,
        gridLengthSeparator: ','
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
            // Use native Spacing property when available
            useNativeSpacing: true,
            // Generate comments for layout decisions
            generateLayoutComments: false,
            // Handle effects (shadows, blur)
            includeEffects: true,
            // Handle transforms
            includeTransforms: true,
            // Generate styles vs inline properties
            useStyles: false,
            ...options
        });
        
        this._nameCounter = 0;
        this._features = FrameworkFeatures[this.options.framework] || FrameworkFeatures.avalonia;
    }
    
    /**
     * Get framework features
     */
    get features() {
        return this._features;
    }
    
    // ==========================================
    // PANEL TYPE SELECTION
    // ==========================================
    
    /**
     * Determine the best XAML panel type for layout properties
     * @param {LayoutProperties} props - Layout properties
     * @param {Object} context - Export context with childCount, etc.
     * @returns {string} Panel type name
     */
    selectPanelType(props, context = {}) {
        if (!props.layoutMode || props.layoutMode === LayoutMode.NONE) {
            return XAMLPanelType.CANVAS;
        }
        
        const childCount = context.childCount || 0;
        
        // Check for uniform sizing hint (all children same size)
        if (props.uniformSizing && this._features.hasUniformGrid) {
            return XAMLPanelType.UNIFORM_GRID;
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
        
        // Check if any child wants to fill - needs Grid
        if (context.hasFillingChild) {
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
        const panelType = this.selectPanelType(props, context);
        
        switch (panelType) {
            case XAMLPanelType.CANVAS:
                return this._transformCanvas(props, context);
            case XAMLPanelType.STACK_PANEL:
                return this._transformStackPanel(props, context);
            case XAMLPanelType.WRAP_PANEL:
                return this._transformWrapPanel(props, context);
            case XAMLPanelType.GRID:
                return this._transformGrid(props, context);
            case XAMLPanelType.UNIFORM_GRID:
                return this._transformUniformGrid(props, context);
            case XAMLPanelType.DOCK_PANEL:
                return this._transformDockPanel(props, context);
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
        
        // Background (Canvas supports Background in Avalonia)
        if (props.backgroundColor) {
            attributes.Background = this._colorToXaml(props.backgroundColor);
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
        
        // Native Spacing (Avalonia 11+, UWP)
        const spacing = props.itemSpacing || 0;
        if (spacing > 0 && this._features.hasStackPanelSpacing && this.options.useNativeSpacing) {
            attributes.Spacing = this.toPixels(spacing);
        }
        
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
        
        // Clipping
        if (props.clipContent) {
            attributes.ClipToBounds = 'True';
        }
        
        return {
            panelType: XAMLPanelType.STACK_PANEL,
            attributes,
            spacing: spacing,
            useNativeSpacing: this._features.hasStackPanelSpacing && this.options.useNativeSpacing,
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
        const spacing = props.itemSpacing || 0;
        const wrapSpacing = props.counterAxisSpacing || props.itemSpacing || 0;
        
        // Note: Most XAML frameworks don't support WrapPanel spacing natively
        // Spacing will be handled via margins on children
        
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
        
        // Alignment
        if (props.primaryAxisAlign !== PrimaryAxisAlign.MIN) {
            if (isHorizontal) {
                attributes.HorizontalAlignment = this._mapPrimaryAlignment(props.primaryAxisAlign);
            } else {
                attributes.VerticalAlignment = this._mapPrimaryAlignment(props.primaryAxisAlign, true);
            }
        }
        
        return {
            panelType: XAMLPanelType.WRAP_PANEL,
            attributes,
            spacing,
            wrapSpacing,
            isHorizontal,
            childWrapper: null,
            counterAxisAlign: props.counterAxisAlign
        };
    }
    
    /**
     * Transform to UniformGrid
     * @private
     */
    _transformUniformGrid(props, context) {
        const isHorizontal = this.isHorizontalLayout(props.layoutMode);
        const attributes = {};
        const childCount = context.childCount || 0;
        
        // Calculate rows/columns
        if (props.uniformColumns) {
            attributes.Columns = props.uniformColumns;
            if (childCount > 0) {
                attributes.Rows = Math.ceil(childCount / props.uniformColumns);
            }
        } else if (props.uniformRows) {
            attributes.Rows = props.uniformRows;
            if (childCount > 0) {
                attributes.Columns = Math.ceil(childCount / props.uniformRows);
            }
        } else {
            // Auto-calculate based on direction
            if (isHorizontal) {
                attributes.Columns = childCount;
                attributes.Rows = 1;
            } else {
                attributes.Rows = childCount;
                attributes.Columns = 1;
            }
        }
        
        // Size
        if (props.sizing.horizontal === SizingMode.FIXED && props.width > 0) {
            attributes.Width = this.toPixels(props.width);
        }
        if (props.sizing.vertical === SizingMode.FIXED && props.height > 0) {
            attributes.Height = this.toPixels(props.height, true);
        }
        
        return {
            panelType: XAMLPanelType.UNIFORM_GRID,
            attributes,
            spacing: props.itemSpacing || 0,
            isHorizontal,
            childWrapper: null
        };
    }
    
    /**
     * Transform to DockPanel
     * @private
     */
    _transformDockPanel(props, context) {
        const attributes = {};
        
        // LastChildFill - fill remaining space with last child
        attributes.LastChildFill = props.lastChildFill !== false ? 'True' : 'False';
        
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
            panelType: XAMLPanelType.DOCK_PANEL,
            attributes,
            childWrapper: null,
            needsDockAttachedProps: true
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
    // EFFECT TRANSFORMATIONS
    // ==========================================
    
    /**
     * Transform effects (shadows, blur) to XAML
     * @param {Object} obj - Object with effect properties
     * @returns {Object} { effectElement, effectAttributes }
     */
    transformEffects(obj) {
        const result = {
            effectElement: null,
            effectAttributes: {}
        };
        
        if (!this.options.includeEffects) return result;
        
        // Drop shadow
        if (obj.dropShadow && this._features.supportsDropShadow) {
            result.effectElement = this._generateDropShadowEffect(obj.dropShadow);
        } else if (obj.effects) {
            // Check effects array
            const shadowEffect = obj.effects.find(e => e.type === 'DROP_SHADOW' || e.type === 'dropShadow');
            if (shadowEffect && this._features.supportsDropShadow) {
                result.effectElement = this._generateDropShadowEffect(shadowEffect);
            }
            
            // Blur effect
            const blurEffect = obj.effects.find(e => e.type === 'LAYER_BLUR' || e.type === 'blur');
            if (blurEffect && this._features.supportsBlur) {
                result.effectElement = this._generateBlurEffect(blurEffect);
            }
        }
        
        // Opacity
        if (obj.opacity !== undefined && obj.opacity !== 1) {
            result.effectAttributes.Opacity = obj.opacity.toString();
        }
        
        return result;
    }
    
    /**
     * Generate DropShadowEffect element
     * @private
     */
    _generateDropShadowEffect(shadow) {
        const attrs = [];
        
        // Color
        if (shadow.color) {
            attrs.push(`Color="${this._colorToXaml(shadow.color)}"`);
        }
        
        // Direction (angle in degrees)
        if (shadow.offset) {
            const angle = Math.atan2(shadow.offset.y, shadow.offset.x) * (180 / Math.PI);
            attrs.push(`Direction="${Math.round(angle)}"`);
            
            // Shadow depth (distance)
            const depth = Math.sqrt(shadow.offset.x ** 2 + shadow.offset.y ** 2);
            attrs.push(`ShadowDepth="${this.toPixels(depth)}"`);
        }
        
        // Blur radius
        if (shadow.radius !== undefined) {
            attrs.push(`BlurRadius="${this.toPixels(shadow.radius)}"`);
        }
        
        // Opacity
        if (shadow.opacity !== undefined) {
            attrs.push(`Opacity="${shadow.opacity}"`);
        }
        
        return `<DropShadowEffect ${attrs.join(' ')}/>`;
    }
    
    /**
     * Generate BlurEffect element
     * @private
     */
    _generateBlurEffect(blur) {
        const attrs = [];
        
        if (blur.radius !== undefined) {
            attrs.push(`Radius="${this.toPixels(blur.radius)}"`);
        }
        
        return `<BlurEffect ${attrs.join(' ')}/>`;
    }
    
    // ==========================================
    // TRANSFORM TRANSFORMATIONS
    // ==========================================
    
    /**
     * Transform object transforms to XAML RenderTransform
     * @param {Object} obj - Object with transform properties
     * @returns {Object} { transformElement, transformOrigin }
     */
    transformTransforms(obj) {
        const result = {
            transformElement: null,
            transformOrigin: null
        };
        
        if (!this.options.includeTransforms) return result;
        
        const transforms = [];
        
        // Rotation
        if (obj.rotation && obj.rotation !== 0) {
            transforms.push(`<RotateTransform Angle="${obj.rotation}"/>`);
        }
        
        // Scale
        if (obj.scale) {
            const scaleX = obj.scale.x ?? obj.scale ?? 1;
            const scaleY = obj.scale.y ?? obj.scale ?? 1;
            if (scaleX !== 1 || scaleY !== 1) {
                transforms.push(`<ScaleTransform ScaleX="${scaleX}" ScaleY="${scaleY}"/>`);
            }
        }
        
        // Skew
        if (obj.skew) {
            const skewX = obj.skew.x ?? 0;
            const skewY = obj.skew.y ?? 0;
            if (skewX !== 0 || skewY !== 0) {
                transforms.push(`<SkewTransform AngleX="${skewX}" AngleY="${skewY}"/>`);
            }
        }
        
        // Translation offset (in addition to position)
        if (obj.translateOffset) {
            const tx = obj.translateOffset.x ?? 0;
            const ty = obj.translateOffset.y ?? 0;
            if (tx !== 0 || ty !== 0) {
                transforms.push(`<TranslateTransform X="${this.toPixels(tx)}" Y="${this.toPixels(ty, true)}"/>`);
            }
        }
        
        // Build transform group or single transform
        if (transforms.length === 1) {
            result.transformElement = transforms[0];
        } else if (transforms.length > 1) {
            result.transformElement = `<TransformGroup>\n    ${transforms.join('\n    ')}\n</TransformGroup>`;
        }
        
        // Transform origin
        if (obj.transformOrigin) {
            const ox = obj.transformOrigin.x ?? 0.5;
            const oy = obj.transformOrigin.y ?? 0.5;
            result.transformOrigin = `${ox},${oy}`;
        }
        
        return result;
    }
    
    // ==========================================
    // FILL/STROKE TRANSFORMATIONS
    // ==========================================
    
    /**
     * Transform fills to XAML brush
     * @param {Array|Object} fills - Fill definitions
     * @returns {string|null} XAML brush markup or color string
     */
    transformFills(fills) {
        if (!fills) return null;
        
        const fillArray = Array.isArray(fills) ? fills : [fills];
        if (fillArray.length === 0) return null;
        
        // Use first visible fill
        const fill = fillArray.find(f => f.visible !== false) || fillArray[0];
        
        switch (fill.type) {
            case 'SOLID':
            case 'solid':
                return this._colorToXaml(fill.color);
                
            case 'LINEAR_GRADIENT':
            case 'linearGradient':
                return this._generateLinearGradientBrush(fill);
                
            case 'RADIAL_GRADIENT':
            case 'radialGradient':
                return this._generateRadialGradientBrush(fill);
                
            case 'IMAGE':
            case 'image':
                return this._generateImageBrush(fill);
                
            default:
                if (fill.color) {
                    return this._colorToXaml(fill.color);
                }
                return null;
        }
    }
    
    /**
     * Transform strokes to XAML
     * @param {Array|Object} strokes - Stroke definitions
     * @returns {Object} { stroke, strokeThickness, strokeDashArray, strokeLineCap, strokeLineJoin }
     */
    transformStrokes(strokes) {
        const result = {};
        
        if (!strokes) return result;
        
        const strokeArray = Array.isArray(strokes) ? strokes : [strokes];
        if (strokeArray.length === 0) return result;
        
        // Use first visible stroke
        const stroke = strokeArray.find(s => s.visible !== false) || strokeArray[0];
        
        // Color
        if (stroke.color) {
            result.stroke = this._colorToXaml(stroke.color);
        } else if (stroke.fills) {
            result.stroke = this.transformFills(stroke.fills);
        }
        
        // Thickness
        if (stroke.weight !== undefined) {
            result.strokeThickness = stroke.weight;
        } else if (stroke.strokeWeight !== undefined) {
            result.strokeThickness = stroke.strokeWeight;
        }
        
        // Dash pattern
        if (stroke.dashPattern && stroke.dashPattern.length > 0) {
            result.strokeDashArray = stroke.dashPattern.join(' ');
        }
        
        // Line cap
        if (stroke.strokeCap) {
            const capMap = {
                'NONE': 'Flat',
                'ROUND': 'Round',
                'SQUARE': 'Square',
                'butt': 'Flat',
                'round': 'Round',
                'square': 'Square'
            };
            result.strokeLineCap = capMap[stroke.strokeCap] || 'Flat';
        }
        
        // Line join
        if (stroke.strokeJoin) {
            const joinMap = {
                'MITER': 'Miter',
                'ROUND': 'Round',
                'BEVEL': 'Bevel',
                'miter': 'Miter',
                'round': 'Round',
                'bevel': 'Bevel'
            };
            result.strokeLineJoin = joinMap[stroke.strokeJoin] || 'Miter';
        }
        
        // Miter limit
        if (stroke.strokeMiterLimit !== undefined) {
            result.strokeMiterLimit = stroke.strokeMiterLimit;
        }
        
        return result;
    }
    
    /**
     * Generate LinearGradientBrush element
     * @private
     */
    _generateLinearGradientBrush(gradient) {
        const stops = this._generateGradientStops(gradient.gradientStops || gradient.stops);
        
        // Calculate start and end points
        let startPoint = '0,0';
        let endPoint = '1,1';
        
        if (gradient.gradientHandlePositions && gradient.gradientHandlePositions.length >= 2) {
            const start = gradient.gradientHandlePositions[0];
            const end = gradient.gradientHandlePositions[1];
            startPoint = `${start.x},${start.y}`;
            endPoint = `${end.x},${end.y}`;
        } else if (gradient.angle !== undefined) {
            // Convert angle to points
            const rad = (gradient.angle * Math.PI) / 180;
            endPoint = `${Math.cos(rad)},${Math.sin(rad)}`;
        }
        
        return `<LinearGradientBrush StartPoint="${startPoint}" EndPoint="${endPoint}">\n    ${stops}\n</LinearGradientBrush>`;
    }
    
    /**
     * Generate RadialGradientBrush element
     * @private
     */
    _generateRadialGradientBrush(gradient) {
        const stops = this._generateGradientStops(gradient.gradientStops || gradient.stops);
        
        // Center and radius
        let center = '0.5,0.5';
        let origin = '0.5,0.5';
        let radiusX = '0.5';
        let radiusY = '0.5';
        
        if (gradient.center) {
            center = `${gradient.center.x},${gradient.center.y}`;
            origin = center;
        }
        
        if (gradient.radius) {
            radiusX = gradient.radius.toString();
            radiusY = gradient.radius.toString();
        }
        
        return `<RadialGradientBrush Center="${center}" GradientOrigin="${origin}" RadiusX="${radiusX}" RadiusY="${radiusY}">\n    ${stops}\n</RadialGradientBrush>`;
    }
    
    /**
     * Generate gradient stops
     * @private
     */
    _generateGradientStops(stops) {
        if (!stops || stops.length === 0) {
            return '<GradientStop Offset="0" Color="White"/>\n    <GradientStop Offset="1" Color="Black"/>';
        }
        
        return stops
            .map(stop => {
                const color = this._colorToXaml(stop.color);
                const offset = stop.position ?? stop.offset ?? 0;
                return `<GradientStop Offset="${offset}" Color="${color}"/>`;
            })
            .join('\n    ');
    }
    
    /**
     * Generate ImageBrush element
     * @private
     */
    _generateImageBrush(fill) {
        const attrs = [];
        
        if (fill.imageRef || fill.src) {
            attrs.push(`ImageSource="${fill.imageRef || fill.src}"`);
        }
        
        // Stretch mode
        const stretchMap = {
            'FILL': 'Fill',
            'FIT': 'Uniform',
            'CROP': 'UniformToFill',
            'TILE': 'None',
            'fill': 'Fill',
            'fit': 'Uniform',
            'cover': 'UniformToFill',
            'contain': 'Uniform',
            'none': 'None'
        };
        
        if (fill.scaleMode) {
            attrs.push(`Stretch="${stretchMap[fill.scaleMode] || 'UniformToFill'}"`);
        }
        
        // Tile mode
        if (fill.scaleMode === 'TILE' || fill.scaleMode === 'tile') {
            attrs.push('TileMode="Tile"');
        }
        
        return `<ImageBrush ${attrs.join(' ')}/>`;
    }
    
    // ==========================================
    // TEXT STYLE TRANSFORMATIONS
    // ==========================================
    
    /**
     * Transform text style to XAML attributes
     * @param {Object} textStyle - Text style properties
     * @returns {Object} XAML text attributes
     */
    transformTextStyle(textStyle) {
        const attrs = {};
        
        if (!textStyle) return attrs;
        
        // Font family
        if (textStyle.fontFamily) {
            attrs.FontFamily = textStyle.fontFamily;
        }
        
        // Font size
        if (textStyle.fontSize) {
            attrs.FontSize = textStyle.fontSize;
        }
        
        // Font weight
        if (textStyle.fontWeight) {
            const weightMap = {
                100: 'Thin', 200: 'ExtraLight', 300: 'Light',
                400: 'Normal', 500: 'Medium', 600: 'SemiBold',
                700: 'Bold', 800: 'ExtraBold', 900: 'Black',
                'normal': 'Normal', 'bold': 'Bold',
                'lighter': 'Light', 'bolder': 'Bold'
            };
            attrs.FontWeight = weightMap[textStyle.fontWeight] || textStyle.fontWeight;
        }
        
        // Font style (italic)
        if (textStyle.fontStyle) {
            const styleMap = {
                'normal': 'Normal',
                'italic': 'Italic',
                'oblique': 'Oblique'
            };
            attrs.FontStyle = styleMap[textStyle.fontStyle] || textStyle.fontStyle;
        }
        
        // Text alignment
        if (textStyle.textAlign || textStyle.textAlignHorizontal) {
            const alignMap = {
                'LEFT': 'Left', 'CENTER': 'Center', 'RIGHT': 'Right', 'JUSTIFIED': 'Justify',
                'left': 'Left', 'center': 'Center', 'right': 'Right', 'justify': 'Justify'
            };
            attrs.TextAlignment = alignMap[textStyle.textAlign || textStyle.textAlignHorizontal] || 'Left';
        }
        
        // Text wrapping
        if (textStyle.textWrapping !== undefined) {
            attrs.TextWrapping = textStyle.textWrapping ? 'Wrap' : 'NoWrap';
        }
        
        // Text trimming
        if (textStyle.textTrimming) {
            const trimMap = {
                'NONE': 'None',
                'CHARACTER': 'CharacterEllipsis',
                'WORD': 'WordEllipsis',
                'none': 'None',
                'ellipsis': 'CharacterEllipsis'
            };
            attrs.TextTrimming = trimMap[textStyle.textTrimming] || 'None';
        }
        
        // Line height
        if (textStyle.lineHeight) {
            // XAML uses LineHeight as absolute value
            if (typeof textStyle.lineHeight === 'number' && textStyle.lineHeight > 0) {
                attrs.LineHeight = textStyle.lineHeight;
            }
        }
        
        // Letter spacing
        if (textStyle.letterSpacing) {
            // Avalonia uses CharacterSpacing
            attrs.CharacterSpacing = textStyle.letterSpacing;
        }
        
        // Text decorations
        if (textStyle.textDecoration) {
            const decoMap = {
                'underline': 'Underline',
                'line-through': 'Strikethrough',
                'strikethrough': 'Strikethrough',
                'overline': 'Overline',
                'none': 'None'
            };
            attrs.TextDecorations = decoMap[textStyle.textDecoration] || 'None';
        }
        
        // Foreground color
        if (textStyle.color || textStyle.fills) {
            const color = this.transformFills(textStyle.fills) || this._colorToXaml(textStyle.color);
            if (color) {
                attrs.Foreground = color;
            }
        }
        
        return attrs;
    }
    
    // ==========================================
    // XAML GENERATION HELPERS
    // ==========================================
    
    /**
     * Convert color to XAML format
     * @param {*} color - Color in various formats
     * @returns {string} XAML color string
     */
    _colorToXaml(color) {
        if (!color) return 'Transparent';
        if (typeof color === 'string') return color;
        
        if (typeof color === 'object') {
            const r = Math.round((color.r ?? 0) * 255).toString(16).padStart(2, '0');
            const g = Math.round((color.g ?? 0) * 255).toString(16).padStart(2, '0');
            const b = Math.round((color.b ?? 0) * 255).toString(16).padStart(2, '0');
            const a = Math.round((color.a ?? 1) * 255).toString(16).padStart(2, '0');
            
            if (color.a != null && color.a < 1) {
                return `#${a}${r}${g}${b}`.toUpperCase();
            }
            return `#${r}${g}${b}`.toUpperCase();
        }
        
        return 'Transparent';
    }
    
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

export { FrameworkFeatures };
export default XAMLLayoutTransformer;
