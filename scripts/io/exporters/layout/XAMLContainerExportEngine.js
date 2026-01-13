/**
 * Asciistrator - XAML Container Export Engine
 * 
 * Concrete container export implementation for XAML output.
 * Uses StackPanel, Grid, WrapPanel for auto-layout with proper nesting.
 * Supports comprehensive styling: effects, transforms, gradients, text styles.
 * 
 * @version 2.0.0
 */

import { StringContainerExportEngine, ContainerType } from './ContainerExportEngine.js';
import { XAMLLayoutTransformer, XAMLPanelType, FrameworkFeatures } from './XAMLLayoutTransformer.js';
import { LayoutMode } from './LayoutExportEngine.js';

// ==========================================
// XAML CONTAINER EXPORT ENGINE
// ==========================================

/**
 * XAML container export engine.
 * Generates XAML with proper layout panels for Avalonia/WPF/MAUI.
 */
export class XAMLContainerExportEngine extends StringContainerExportEngine {
    /**
     * @param {Object} options - Export options
     */
    constructor(options = {}) {
        const layoutEngine = new XAMLLayoutTransformer({
            cellWidth: options.cellWidth || 10,
            cellHeight: options.cellHeight || 18,
            framework: options.framework || 'avalonia',
            preferGrid: options.preferGrid || false,
            useNativeSpacing: options.useNativeSpacing !== false,
            includeEffects: options.includeEffects !== false,
            includeTransforms: options.includeTransforms !== false,
            ...options.layoutOptions
        });
        
        super(layoutEngine, {
            // XAML-specific options
            framework: 'avalonia',
            namespace: 'Generated',
            className: 'AsciiView',
            fontFamily: 'Consolas',
            fontSize: 12,
            backgroundColor: '#1a1a2e',
            defaultColor: '#e0e0e0',
            generateComments: true,
            wrapInUserControl: true,
            indentSize: 4,
            // Style options
            includeEffects: true,
            includeTransforms: true,
            includeGradients: true,
            useStyles: false,
            generateResources: false,
            // Naming
            generateNames: false,
            namePrefix: '',
            ...options
        });
        
        this._features = FrameworkFeatures[this.options.framework] || FrameworkFeatures.avalonia;
        this._resourceMap = new Map();
        this._styleMap = new Map();
    }
    
    /**
     * Get framework features
     */
    get features() {
        return this._features;
    }
    
    // ==========================================
    // CONTAINER GENERATION
    // ==========================================
    
    /**
     * Begin container element
     * @override
     */
    _beginContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        // Get layout transformation
        const layoutResult = this.layoutEngine.transformContainerLayout(
            layoutProps || this.layoutEngine.extractLayoutProperties(container),
            { 
                ...context, 
                childCount: container.children?.length || 0,
                hasFillingChild: this._hasFillingChild(container)
            }
        );
        
        // Build panel element
        const panelType = layoutResult.panelType;
        const panelAttrs = this._buildPanelAttributes(container, layoutResult, context);
        
        // Add comment if enabled
        if (this.options.generateComments && container.name) {
            lines.push(`${ind}<!-- ${this._escapeXaml(container.name)} -->`);
        }
        
        // Wrap in Border if has background, border, or corner radius
        const needsBorder = this._needsBorder(container);
        
        // Check if we need effect wrapper
        const effectResult = this.options.includeEffects ? 
            this.layoutEngine.transformEffects(container) : { effectElement: null, effectAttributes: {} };
        const needsEffectWrapper = effectResult.effectElement != null;
        
        // Check if we need transform wrapper
        const transformResult = this.options.includeTransforms ?
            this.layoutEngine.transformTransforms(container) : { transformElement: null, transformOrigin: null };
        
        if (needsBorder) {
            const borderAttrs = this._buildBorderAttributes(container, layoutResult, effectResult, transformResult);
            lines.push(`${ind}<Border${borderAttrs}>`);
            
            // Add effect inside Border if needed
            if (needsEffectWrapper) {
                lines.push(`${ind}${this.indent(1)}<Border.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</Border.Effect>`);
            }
            
            // Add transform inside Border if needed
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<Border.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</Border.RenderTransform>`);
            }
        }
        
        // Open panel
        const panelIndent = needsBorder ? this.indent(1) : '';
        lines.push(`${ind}${panelIndent}<${panelType}${panelAttrs}>`);
        
        // Grid definitions if needed
        if (panelType === XAMLPanelType.GRID && layoutResult.definitions) {
            const defIndent = context.depth + 1 + (needsBorder ? 1 : 0);
            lines.push(this._generateGridDefinitions(layoutResult.definitions, defIndent));
        }
        
        // Store layout result for children
        context._currentLayoutResult = layoutResult;
        context._needsBorder = needsBorder;
        context._panelIndent = panelIndent;
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * Check if any child wants to fill
     * @private
     */
    _hasFillingChild(container) {
        if (!container.children) return false;
        return container.children.some(child => {
            const sizing = child.layoutSizing || child.sizing || {};
            return sizing.horizontal === 'FILL' || sizing.vertical === 'FILL' ||
                   child.layoutGrow === 1 || child.flexGrow === 1;
        });
    }
    
    /**
     * End container element
     * @override
     */
    _endContainer(container, containerType, layoutProps, context) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const layoutResult = context._currentLayoutResult || 
            this.layoutEngine.transformContainerLayout(
                layoutProps || this.layoutEngine.extractLayoutProperties(container),
                context
            );
        
        const panelType = layoutResult.panelType;
        const needsBorder = context._needsBorder || this._needsBorder(container);
        const panelIndent = context._panelIndent || (needsBorder ? this.indent(1) : '');
        
        // Close panel
        lines.push(`${ind}${panelIndent}</${panelType}>`);
        
        // Close Border if needed
        if (needsBorder) {
            lines.push(`${ind}</Border>`);
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * Export non-container child
     * @override
     */
    _exportChild(child, childLayout, context, index) {
        const ind = this.indent(context.depth);
        
        // Get child attributes
        const attrs = childLayout?.attributes || {};
        const attachedProps = childLayout?.attachedProps || {};
        
        // Merge all attributes
        const allAttrs = { ...attrs, ...attachedProps };
        
        // Generate element based on type
        return this._generateChildXAML(child, allAttrs, context, index);
    }
    
    // ==========================================
    // XAML ELEMENT GENERATION
    // ==========================================
    
    /**
     * Check if container needs Border wrapper
     * @private
     */
    _needsBorder(container) {
        // Background
        if (container.backgroundColor || container.fills?.length > 0) return true;
        
        // Border stroke
        if (container.showBorder || container.strokes?.length > 0 || 
            container.stroke?.color || container.borderColor) return true;
        
        // Corner radius
        if (container.cornerRadius) {
            if (typeof container.cornerRadius === 'number' && container.cornerRadius > 0) return true;
            if (typeof container.cornerRadius === 'object' && 
                (container.cornerRadius.topLeft > 0 || container.cornerRadius.topRight > 0 ||
                 container.cornerRadius.bottomLeft > 0 || container.cornerRadius.bottomRight > 0)) return true;
        }
        
        // Effects that need wrapper
        if (container.dropShadow || container.effects?.length > 0) return true;
        
        return false;
    }
    
    /**
     * Build panel attributes
     * @private
     */
    _buildPanelAttributes(container, layoutResult, context) {
        const attrs = { ...layoutResult.attributes };
        
        // Name
        if (this.options.generateNames && (container.name || container.id)) {
            attrs['x:Name'] = this._toXamlName(container.name || container.id);
        }
        
        // Padding for content (if no border wrapper, padding goes on panel)
        if (!this._needsBorder(container)) {
            const props = this.layoutEngine.extractLayoutProperties(container);
            const padding = this.layoutEngine.transformPadding(props.padding);
            if (padding && layoutResult.panelType !== XAMLPanelType.CANVAS) {
                // Some panels don't support Padding directly
                if (layoutResult.panelType === XAMLPanelType.GRID) {
                    // Grid doesn't have Padding, but we can use Margin on a wrapper
                }
            }
        }
        
        return this._formatAttributes(attrs);
    }
    
    /**
     * Build Border attributes with full styling support
     * @private
     */
    _buildBorderAttributes(container, layoutResult, effectResult = {}, transformResult = {}) {
        const attrs = {};
        
        // Background - use gradient or solid
        const bgFill = this.layoutEngine.transformFills(container.fills);
        if (bgFill) {
            // For complex brushes, we'll need property element syntax
            if (bgFill.startsWith('<')) {
                attrs._backgroundElement = bgFill;
            } else {
                attrs.Background = bgFill;
            }
        } else if (container.backgroundColor) {
            attrs.Background = container.backgroundColor;
        }
        
        // Border stroke
        const strokeResult = this.layoutEngine.transformStrokes(container.strokes || container.stroke);
        if (strokeResult.stroke) {
            if (strokeResult.stroke.startsWith('<')) {
                attrs._borderBrushElement = strokeResult.stroke;
            } else {
                attrs.BorderBrush = strokeResult.stroke;
            }
        } else {
            const borderColor = this._getBorderColor(container);
            if (borderColor) {
                attrs.BorderBrush = borderColor;
            }
        }
        
        // Border thickness
        if (strokeResult.strokeThickness !== undefined) {
            attrs.BorderThickness = strokeResult.strokeThickness;
        } else {
            const thickness = this._getBorderThickness(container);
            if (thickness && thickness !== 0) {
                attrs.BorderThickness = thickness;
            }
        }
        
        // Corner radius
        const cornerRadius = this._getCornerRadius(container);
        if (cornerRadius) {
            attrs.CornerRadius = cornerRadius;
        }
        
        // Padding
        const props = this.layoutEngine.extractLayoutProperties(container);
        const padding = this.layoutEngine.transformPadding(props.padding);
        if (padding) {
            attrs.Padding = padding;
        }
        
        // Size from layout result
        if (layoutResult.attributes?.Width) {
            attrs.Width = layoutResult.attributes.Width;
            delete layoutResult.attributes.Width;
        }
        if (layoutResult.attributes?.Height) {
            attrs.Height = layoutResult.attributes.Height;
            delete layoutResult.attributes.Height;
        }
        
        // Clipping
        if (props.clipContent) {
            attrs.ClipToBounds = 'True';
        }
        
        // Opacity from effects
        if (effectResult.effectAttributes?.Opacity) {
            attrs.Opacity = effectResult.effectAttributes.Opacity;
        } else if (container.opacity !== undefined && container.opacity !== 1) {
            attrs.Opacity = container.opacity.toString();
        }
        
        // Transform origin
        if (transformResult.transformOrigin) {
            attrs.RenderTransformOrigin = transformResult.transformOrigin;
        }
        
        // Name if generating names
        if (this.options.generateNames && (container.name || container.id)) {
            attrs['x:Name'] = this._toXamlName(container.name || container.id);
        }
        
        return this._formatAttributesWithElements(attrs);
    }
    
    /**
     * Generate Grid row/column definitions
     * @private
     */
    _generateGridDefinitions(definitions, depth) {
        const ind = this.indent(depth);
        const lines = [];
        
        // Row definitions
        if (definitions.rows?.length > 0) {
            lines.push(`${ind}<Grid.RowDefinitions>`);
            for (const row of definitions.rows) {
                lines.push(`${ind}    <RowDefinition Height="${row.size}"/>`);
            }
            lines.push(`${ind}</Grid.RowDefinitions>`);
        }
        
        // Column definitions
        if (definitions.columns?.length > 0) {
            lines.push(`${ind}<Grid.ColumnDefinitions>`);
            for (const col of definitions.columns) {
                lines.push(`${ind}    <ColumnDefinition Width="${col.size}"/>`);
            }
            lines.push(`${ind}</Grid.ColumnDefinitions>`);
        }
        
        return lines.join(this.options.lineEnding);
    }
    
    /**
     * Generate XAML for child element with full property support
     * @private
     */
    _generateChildXAML(child, attrs, context, index) {
        const ind = this.indent(context.depth);
        
        // Add effects/transforms to child if needed
        const effectResult = this.options.includeEffects ? 
            this.layoutEngine.transformEffects(child) : { effectElement: null, effectAttributes: {} };
        const transformResult = this.options.includeTransforms ?
            this.layoutEngine.transformTransforms(child) : { transformElement: null, transformOrigin: null };
        
        // Add effect attributes to base attrs
        if (effectResult.effectAttributes) {
            Object.assign(attrs, effectResult.effectAttributes);
        }
        if (transformResult.transformOrigin) {
            attrs.RenderTransformOrigin = transformResult.transformOrigin;
        }
        
        switch (child.type) {
            case 'text':
            case 'ascii-text':
            case 'TEXT':
                return this._generateTextBlock(child, attrs, context, effectResult, transformResult);
                
            case 'line':
            case 'LINE':
                return this._generateLine(child, attrs, context);
                
            case 'rectangle':
            case 'RECTANGLE':
                return this._generateRectangle(child, attrs, context, effectResult, transformResult);
                
            case 'ellipse':
            case 'ELLIPSE':
                return this._generateEllipse(child, attrs, context, effectResult, transformResult);
                
            case 'path':
            case 'PATH':
            case 'VECTOR':
                return this._generatePath(child, attrs, context, effectResult, transformResult);
                
            case 'polygon':
            case 'POLYGON':
                return this._generatePolygon(child, attrs, context);
                
            case 'polyline':
            case 'POLYLINE':
                return this._generatePolyline(child, attrs, context);
                
            case 'image':
            case 'IMAGE':
                return this._generateImage(child, attrs, context);
                
            default:
                // Generic Border with content
                return this._generateGenericElement(child, attrs, context, effectResult, transformResult);
        }
    }
    
    /**
     * Generate TextBlock with full text styling
     * @private
     */
    _generateTextBlock(child, attrs, context, effectResult = {}, transformResult = {}) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const textAttrs = { ...attrs };
        
        // Text content
        const textContent = child.text || child.characters || '';
        textAttrs.Text = this._escapeXaml(textContent);
        
        // Apply text styles
        const textStyle = child.style || child.textStyle || child;
        const styleAttrs = this.layoutEngine.transformTextStyle(textStyle);
        Object.assign(textAttrs, styleAttrs);
        
        // Default font if not specified
        if (!textAttrs.FontFamily) {
            textAttrs.FontFamily = this.options.fontFamily;
        }
        if (!textAttrs.FontSize) {
            textAttrs.FontSize = this.options.fontSize;
        }
        
        // Foreground color
        if (!textAttrs.Foreground) {
            const fill = this.layoutEngine.transformFills(child.fills);
            textAttrs.Foreground = fill || this._getChildForeground(child);
        }
        
        // Generate element
        const needsChildren = effectResult.effectElement || transformResult.transformElement;
        
        if (needsChildren) {
            lines.push(`${ind}<TextBlock ${this._formatAttributesInline(textAttrs)}>`);
            
            if (effectResult.effectElement) {
                lines.push(`${ind}${this.indent(1)}<TextBlock.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</TextBlock.Effect>`);
            }
            
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<TextBlock.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</TextBlock.RenderTransform>`);
            }
            
            lines.push(`${ind}</TextBlock>`);
            return lines.join(this.options.lineEnding);
        }
        
        return `${ind}<TextBlock ${this._formatAttributesInline(textAttrs)}/>`;
    }
    
    /**
     * Generate Line shape
     * @private
     */
    _generateLine(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const lineAttrs = { ...attrs };
        lineAttrs.X1 = this.layoutEngine.toPixels(child.x1 || child.start?.x || 0);
        lineAttrs.Y1 = this.layoutEngine.toPixels(child.y1 || child.start?.y || 0, true);
        lineAttrs.X2 = this.layoutEngine.toPixels(child.x2 || child.end?.x || 0);
        lineAttrs.Y2 = this.layoutEngine.toPixels(child.y2 || child.end?.y || 0, true);
        
        // Stroke
        const strokeResult = this.layoutEngine.transformStrokes(child.strokes || child.stroke);
        lineAttrs.Stroke = strokeResult.stroke || this._getChildStroke(child);
        if (strokeResult.strokeThickness !== undefined) {
            lineAttrs.StrokeThickness = strokeResult.strokeThickness;
        } else {
            lineAttrs.StrokeThickness = child.stroke?.weight || child.strokeWeight || 1;
        }
        
        // Stroke dash
        if (strokeResult.strokeDashArray) {
            lineAttrs.StrokeDashArray = strokeResult.strokeDashArray;
        }
        if (strokeResult.strokeLineCap) {
            lineAttrs.StrokeLineCap = strokeResult.strokeLineCap;
        }
        
        return `${ind}<Line ${this._formatAttributesInline(lineAttrs)}/>`;
    }
    
    /**
     * Generate Rectangle shape with full styling
     * @private
     */
    _generateRectangle(child, attrs, context, effectResult = {}, transformResult = {}) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const rectAttrs = { ...attrs };
        
        // Fill
        const fill = this.layoutEngine.transformFills(child.fills);
        if (fill && !fill.startsWith('<')) {
            rectAttrs.Fill = fill;
        } else if (!fill) {
            rectAttrs.Fill = this._getChildFill(child);
        }
        
        // Stroke
        const strokeResult = this.layoutEngine.transformStrokes(child.strokes || child.stroke);
        const strokeColor = strokeResult.stroke || this._getChildStroke(child);
        if (strokeColor !== 'Transparent') {
            rectAttrs.Stroke = strokeColor;
            rectAttrs.StrokeThickness = strokeResult.strokeThickness ?? child.stroke?.weight ?? 1;
        }
        
        // Corner radius
        const radius = this._getCornerRadius(child);
        if (radius) {
            rectAttrs.RadiusX = typeof radius === 'string' && radius.includes(',') ? 
                radius.split(',')[0] : radius;
            rectAttrs.RadiusY = typeof radius === 'string' && radius.includes(',') ? 
                radius.split(',')[0] : radius;
        }
        
        // Size
        if (child.width) rectAttrs.Width = this.layoutEngine.toPixels(child.width);
        if (child.height) rectAttrs.Height = this.layoutEngine.toPixels(child.height, true);
        
        // Check if we need child elements
        const needsFillElement = fill && fill.startsWith('<');
        const needsChildren = needsFillElement || effectResult.effectElement || transformResult.transformElement;
        
        if (needsChildren) {
            lines.push(`${ind}<Rectangle ${this._formatAttributesInline(rectAttrs)}>`);
            
            if (needsFillElement) {
                lines.push(`${ind}${this.indent(1)}<Rectangle.Fill>`);
                lines.push(`${ind}${this.indent(2)}${fill}`);
                lines.push(`${ind}${this.indent(1)}</Rectangle.Fill>`);
            }
            
            if (effectResult.effectElement) {
                lines.push(`${ind}${this.indent(1)}<Rectangle.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</Rectangle.Effect>`);
            }
            
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<Rectangle.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</Rectangle.RenderTransform>`);
            }
            
            lines.push(`${ind}</Rectangle>`);
            return lines.join(this.options.lineEnding);
        }
        
        return `${ind}<Rectangle ${this._formatAttributesInline(rectAttrs)}/>`;
    }
    
    /**
     * Generate Ellipse shape with full styling
     * @private
     */
    _generateEllipse(child, attrs, context, effectResult = {}, transformResult = {}) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const ellipseAttrs = { ...attrs };
        
        // Fill
        const fill = this.layoutEngine.transformFills(child.fills);
        if (fill && !fill.startsWith('<')) {
            ellipseAttrs.Fill = fill;
        } else if (!fill) {
            ellipseAttrs.Fill = this._getChildFill(child);
        }
        
        // Stroke
        const strokeResult = this.layoutEngine.transformStrokes(child.strokes || child.stroke);
        const strokeColor = strokeResult.stroke || this._getChildStroke(child);
        if (strokeColor !== 'Transparent') {
            ellipseAttrs.Stroke = strokeColor;
            ellipseAttrs.StrokeThickness = strokeResult.strokeThickness ?? child.stroke?.weight ?? 1;
        }
        
        // Size
        if (child.width) ellipseAttrs.Width = this.layoutEngine.toPixels(child.width);
        if (child.height) ellipseAttrs.Height = this.layoutEngine.toPixels(child.height, true);
        
        // Check if we need child elements
        const needsFillElement = fill && fill.startsWith('<');
        const needsChildren = needsFillElement || effectResult.effectElement || transformResult.transformElement;
        
        if (needsChildren) {
            lines.push(`${ind}<Ellipse ${this._formatAttributesInline(ellipseAttrs)}>`);
            
            if (needsFillElement) {
                lines.push(`${ind}${this.indent(1)}<Ellipse.Fill>`);
                lines.push(`${ind}${this.indent(2)}${fill}`);
                lines.push(`${ind}${this.indent(1)}</Ellipse.Fill>`);
            }
            
            if (effectResult.effectElement) {
                lines.push(`${ind}${this.indent(1)}<Ellipse.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</Ellipse.Effect>`);
            }
            
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<Ellipse.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</Ellipse.RenderTransform>`);
            }
            
            lines.push(`${ind}</Ellipse>`);
            return lines.join(this.options.lineEnding);
        }
        
        return `${ind}<Ellipse ${this._formatAttributesInline(ellipseAttrs)}/>`;
    }
    
    /**
     * Generate Path shape with full styling
     * @private
     */
    _generatePath(child, attrs, context, effectResult = {}, transformResult = {}) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const pathAttrs = { ...attrs };
        
        // Path data
        pathAttrs.Data = child.pathData || child.d || child.data || '';
        
        // Fill
        const fill = this.layoutEngine.transformFills(child.fills);
        if (fill && !fill.startsWith('<')) {
            pathAttrs.Fill = fill;
        } else if (!fill) {
            pathAttrs.Fill = this._getChildFill(child);
        }
        
        // Stroke
        const strokeResult = this.layoutEngine.transformStrokes(child.strokes || child.stroke);
        const strokeColor = strokeResult.stroke || this._getChildStroke(child);
        if (strokeColor !== 'Transparent') {
            pathAttrs.Stroke = strokeColor;
            pathAttrs.StrokeThickness = strokeResult.strokeThickness ?? child.stroke?.weight ?? 1;
            
            if (strokeResult.strokeLineCap) {
                pathAttrs.StrokeLineCap = strokeResult.strokeLineCap;
            }
            if (strokeResult.strokeLineJoin) {
                pathAttrs.StrokeLineJoin = strokeResult.strokeLineJoin;
            }
            if (strokeResult.strokeDashArray) {
                pathAttrs.StrokeDashArray = strokeResult.strokeDashArray;
            }
        }
        
        // Fill rule
        if (child.fillRule) {
            const ruleMap = {
                'NONZERO': 'NonZero',
                'EVENODD': 'EvenOdd',
                'nonzero': 'NonZero',
                'evenodd': 'EvenOdd'
            };
            pathAttrs.FillRule = ruleMap[child.fillRule] || 'NonZero';
        }
        
        // Stretch
        if (child.stretch) {
            pathAttrs.Stretch = child.stretch;
        }
        
        // Check if we need child elements
        const needsFillElement = fill && fill.startsWith('<');
        const needsChildren = needsFillElement || effectResult.effectElement || transformResult.transformElement;
        
        if (needsChildren) {
            lines.push(`${ind}<Path ${this._formatAttributesInline(pathAttrs)}>`);
            
            if (needsFillElement) {
                lines.push(`${ind}${this.indent(1)}<Path.Fill>`);
                lines.push(`${ind}${this.indent(2)}${fill}`);
                lines.push(`${ind}${this.indent(1)}</Path.Fill>`);
            }
            
            if (effectResult.effectElement) {
                lines.push(`${ind}${this.indent(1)}<Path.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</Path.Effect>`);
            }
            
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<Path.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</Path.RenderTransform>`);
            }
            
            lines.push(`${ind}</Path>`);
            return lines.join(this.options.lineEnding);
        }
        
        return `${ind}<Path ${this._formatAttributesInline(pathAttrs)}/>`;
    }
    
    /**
     * Generate Polygon shape
     * @private
     */
    _generatePolygon(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const polygonAttrs = { ...attrs };
        
        // Points
        if (child.points) {
            if (Array.isArray(child.points)) {
                polygonAttrs.Points = child.points
                    .map(p => `${this.layoutEngine.toPixels(p.x)},${this.layoutEngine.toPixels(p.y, true)}`)
                    .join(' ');
            } else {
                polygonAttrs.Points = child.points;
            }
        }
        
        // Fill
        polygonAttrs.Fill = this._getChildFill(child);
        
        // Stroke
        const stroke = this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            polygonAttrs.Stroke = stroke;
            polygonAttrs.StrokeThickness = child.stroke?.weight || 1;
        }
        
        return `${ind}<Polygon ${this._formatAttributesInline(polygonAttrs)}/>`;
    }
    
    /**
     * Generate Polyline shape
     * @private
     */
    _generatePolyline(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const polylineAttrs = { ...attrs };
        
        // Points
        if (child.points) {
            if (Array.isArray(child.points)) {
                polylineAttrs.Points = child.points
                    .map(p => `${this.layoutEngine.toPixels(p.x)},${this.layoutEngine.toPixels(p.y, true)}`)
                    .join(' ');
            } else {
                polylineAttrs.Points = child.points;
            }
        }
        
        // Stroke (no fill for polyline typically)
        polylineAttrs.Stroke = this._getChildStroke(child);
        polylineAttrs.StrokeThickness = child.stroke?.weight || 1;
        
        return `${ind}<Polyline ${this._formatAttributesInline(polylineAttrs)}/>`;
    }
    
    /**
     * Generate Image element
     * @private
     */
    _generateImage(child, attrs, context) {
        const ind = this.indent(context.depth);
        
        const imageAttrs = { ...attrs };
        
        // Source
        if (child.src || child.imageRef || child.source) {
            imageAttrs.Source = child.src || child.imageRef || child.source;
        }
        
        // Stretch mode
        const stretchMap = {
            'FILL': 'Fill',
            'FIT': 'Uniform',
            'CROP': 'UniformToFill',
            'TILE': 'None',
            'cover': 'UniformToFill',
            'contain': 'Uniform',
            'fill': 'Fill',
            'none': 'None'
        };
        
        if (child.scaleMode || child.objectFit) {
            imageAttrs.Stretch = stretchMap[child.scaleMode || child.objectFit] || 'Uniform';
        }
        
        // Size
        if (child.width) imageAttrs.Width = this.layoutEngine.toPixels(child.width);
        if (child.height) imageAttrs.Height = this.layoutEngine.toPixels(child.height, true);
        
        return `${ind}<Image ${this._formatAttributesInline(imageAttrs)}/>`;
    }
    
    /**
     * Generate generic Border element for unknown types
     * @private
     */
    _generateGenericElement(child, attrs, context, effectResult = {}, transformResult = {}) {
        const ind = this.indent(context.depth);
        const lines = [];
        
        const borderAttrs = { ...attrs };
        
        // Background
        const fill = this.layoutEngine.transformFills(child.fills);
        if (fill && !fill.startsWith('<')) {
            borderAttrs.Background = fill;
        } else if (!fill) {
            borderAttrs.Background = this._getChildFill(child);
        }
        
        // Border
        const strokeResult = this.layoutEngine.transformStrokes(child.strokes || child.stroke);
        const stroke = strokeResult.stroke || this._getChildStroke(child);
        if (stroke !== 'Transparent') {
            borderAttrs.BorderBrush = stroke;
            borderAttrs.BorderThickness = strokeResult.strokeThickness ?? child.stroke?.weight ?? 1;
        }
        
        // Corner radius
        const cornerRadius = this._getCornerRadius(child);
        if (cornerRadius) {
            borderAttrs.CornerRadius = cornerRadius;
        }
        
        // Size
        if (child.width) borderAttrs.Width = this.layoutEngine.toPixels(child.width);
        if (child.height) borderAttrs.Height = this.layoutEngine.toPixels(child.height, true);
        
        // Check if we need child elements
        const needsFillElement = fill && fill.startsWith('<');
        const needsChildren = needsFillElement || effectResult.effectElement || transformResult.transformElement;
        
        if (needsChildren) {
            lines.push(`${ind}<Border ${this._formatAttributesInline(borderAttrs)}>`);
            
            if (needsFillElement) {
                lines.push(`${ind}${this.indent(1)}<Border.Background>`);
                lines.push(`${ind}${this.indent(2)}${fill}`);
                lines.push(`${ind}${this.indent(1)}</Border.Background>`);
            }
            
            if (effectResult.effectElement) {
                lines.push(`${ind}${this.indent(1)}<Border.Effect>`);
                lines.push(`${ind}${this.indent(2)}${effectResult.effectElement}`);
                lines.push(`${ind}${this.indent(1)}</Border.Effect>`);
            }
            
            if (transformResult.transformElement) {
                lines.push(`${ind}${this.indent(1)}<Border.RenderTransform>`);
                lines.push(`${ind}${this.indent(2)}${transformResult.transformElement}`);
                lines.push(`${ind}${this.indent(1)}</Border.RenderTransform>`);
            }
            
            lines.push(`${ind}</Border>`);
            return lines.join(this.options.lineEnding);
        }
        
        return `${ind}<Border ${this._formatAttributesInline(borderAttrs)}/>`;
    }
    
    // ==========================================
    // ATTRIBUTE FORMATTING
    // ==========================================
    
    /**
     * Format attributes as multi-line string
     * @private
     */
    _formatAttributes(attrs) {
        if (!attrs || Object.keys(attrs).length === 0) return '';
        
        return ' ' + Object.entries(attrs)
            .filter(([k, v]) => v != null && !k.startsWith('_'))
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
    }
    
    /**
     * Format attributes with element-syntax properties
     * @private
     */
    _formatAttributesWithElements(attrs) {
        if (!attrs || Object.keys(attrs).length === 0) return '';
        
        // Filter out element properties (they'll be added as child elements)
        return ' ' + Object.entries(attrs)
            .filter(([k, v]) => v != null && !k.startsWith('_'))
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
    }
    
    /**
     * Format attributes inline
     * @private
     */
    _formatAttributesInline(attrs) {
        if (!attrs || Object.keys(attrs).length === 0) return '';
        
        return Object.entries(attrs)
            .filter(([k, v]) => v != null && !k.startsWith('_'))
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
    }
    
    /**
     * Convert name to valid XAML x:Name
     * @private
     */
    _toXamlName(name) {
        if (!name) return null;
        
        // Remove invalid characters, ensure starts with letter
        let xamlName = name.replace(/[^a-zA-Z0-9_]/g, '_');
        if (!/^[a-zA-Z]/.test(xamlName)) {
            xamlName = 'x_' + xamlName;
        }
        return xamlName;
    }
    
    // ==========================================
    // COLOR HELPERS
    // ==========================================
    
    /**
     * Get background color
     * @private
     */
    _getBackgroundColor(obj) {
        if (obj.backgroundColor) return obj.backgroundColor;
        if (obj.fills?.length > 0) {
            const fill = obj.fills.find(f => f.visible !== false) || obj.fills[0];
            if (fill.type === 'SOLID' || fill.type === 'solid' || !fill.type) {
                return this._colorToXaml(fill.color);
            }
        }
        return null;
    }
    
    /**
     * Get border color
     * @private
     */
    _getBorderColor(obj) {
        if (obj.stroke?.color) return this._colorToXaml(obj.stroke.color);
        if (obj.borderColor) return obj.borderColor;
        if (obj.strokes?.length > 0) {
            const stroke = obj.strokes.find(s => s.visible !== false) || obj.strokes[0];
            return this._colorToXaml(stroke.color);
        }
        return null;
    }
    
    /**
     * Get border thickness
     * @private
     */
    _getBorderThickness(obj) {
        if (obj.stroke?.weight) return obj.stroke.weight;
        if (obj.strokeWeight) return obj.strokeWeight;
        if (obj.borderWidth) return obj.borderWidth;
        if (obj.strokes?.length > 0) {
            const stroke = obj.strokes.find(s => s.visible !== false) || obj.strokes[0];
            return stroke.weight || stroke.strokeWeight || 1;
        }
        return null;
    }
    
    /**
     * Get corner radius
     * @private
     */
    _getCornerRadius(obj) {
        if (!obj.cornerRadius) return null;
        
        if (typeof obj.cornerRadius === 'number') {
            return obj.cornerRadius > 0 ? obj.cornerRadius : null;
        }
        
        if (obj.cornerRadius.independent || obj.cornerRadius.topLeft !== undefined) {
            const tl = obj.cornerRadius.topLeft || 0;
            const tr = obj.cornerRadius.topRight || 0;
            const br = obj.cornerRadius.bottomRight || 0;
            const bl = obj.cornerRadius.bottomLeft || 0;
            
            // If all same, return single value
            if (tl === tr && tr === br && br === bl) {
                return tl > 0 ? tl : null;
            }
            
            return `${tl},${tr},${br},${bl}`;
        }
        
        return obj.cornerRadius.topLeft || null;
    }
    
    /**
     * Get child foreground color
     * @private
     */
    _getChildForeground(child) {
        if (child.fillColor) return child.fillColor;
        if (child.color) return this._colorToXaml(child.color);
        if (child.fills?.length > 0) {
            const fill = child.fills.find(f => f.visible !== false) || child.fills[0];
            if (fill.type === 'SOLID' || fill.type === 'solid' || !fill.type) {
                return this._colorToXaml(fill.color);
            }
        }
        return this.options.defaultColor;
    }
    
    /**
     * Get child fill
     * @private
     */
    _getChildFill(child) {
        if (child.fillColor) return child.fillColor;
        if (child.fills?.length > 0) {
            const fill = child.fills.find(f => f.visible !== false) || child.fills[0];
            if (fill.type === 'SOLID' || fill.type === 'solid' || !fill.type) {
                return this._colorToXaml(fill.color);
            }
        }
        return 'Transparent';
    }
    
    /**
     * Get child stroke
     * @private
     */
    _getChildStroke(child) {
        if (child.strokeColor) return child.strokeColor;
        if (child.stroke?.color) return this._colorToXaml(child.stroke.color);
        if (child.strokes?.length > 0) {
            const stroke = child.strokes.find(s => s.visible !== false) || child.strokes[0];
            return this._colorToXaml(stroke.color);
        }
        return 'Transparent';
    }
    
    /**
     * Convert color to XAML format
     * @private
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
     * Escape XAML special characters
     * @private
     */
    _escapeXaml(text) {
        if (typeof text !== 'string') return String(text || '');
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    // ==========================================
    // DOCUMENT GENERATION
    // ==========================================
    
    /**
     * Generate complete XAML document
     * @param {Object} rootContainer - Root container to export
     * @param {Object} options - Additional options
     * @returns {string}
     */
    generateDocument(rootContainer, options = {}) {
        const mergedOptions = { ...this.options, ...options };
        const lines = [];
        
        // XML declaration
        lines.push('<?xml version="1.0" encoding="utf-8"?>');
        
        // Comment
        if (mergedOptions.generateComments) {
            lines.push(`<!-- Generated by Asciistrator - ${mergedOptions.framework.toUpperCase()} XAML -->`);
            lines.push(`<!-- Framework: ${mergedOptions.framework} -->`);
            lines.push('');
        }
        
        // Root element
        if (mergedOptions.wrapInUserControl) {
            const ns = this._getNamespaces(mergedOptions);
            const rootType = mergedOptions.rootType || 'UserControl';
            
            lines.push(`<${rootType}`);
            lines.push(`    ${ns.join('\n    ')}`);
            lines.push(`    x:Class="${mergedOptions.namespace}.${mergedOptions.className}">`);
            
            // Resources if generating
            if (mergedOptions.generateResources && this._resourceMap.size > 0) {
                lines.push(this._generateResources(mergedOptions));
            }
        }
        
        // Export container
        const startDepth = mergedOptions.wrapInUserControl ? 1 : 0;
        const content = this.exportContainer(rootContainer, { depth: startDepth });
        if (content) {
            lines.push(content);
        }
        
        // Close root
        if (mergedOptions.wrapInUserControl) {
            const rootType = mergedOptions.rootType || 'UserControl';
            lines.push(`</${rootType}>`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Generate XAML for Window
     * @param {Object} rootContainer - Root container
     * @param {Object} options - Options
     * @returns {string}
     */
    generateWindow(rootContainer, options = {}) {
        return this.generateDocument(rootContainer, {
            ...options,
            wrapInUserControl: true,
            rootType: 'Window'
        });
    }
    
    /**
     * Generate XAML for UserControl
     * @param {Object} rootContainer - Root container
     * @param {Object} options - Options
     * @returns {string}
     */
    generateUserControl(rootContainer, options = {}) {
        return this.generateDocument(rootContainer, {
            ...options,
            wrapInUserControl: true,
            rootType: 'UserControl'
        });
    }
    
    /**
     * Get namespace declarations
     * @private
     */
    _getNamespaces(options = {}) {
        const framework = options.framework || this.options.framework;
        const declarations = [];
        
        switch (framework) {
            case 'avalonia':
                declarations.push('xmlns="https://github.com/avaloniaui"');
                declarations.push('xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
                declarations.push('xmlns:d="http://schemas.microsoft.com/expression/blend/2008"');
                declarations.push('xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"');
                declarations.push('mc:Ignorable="d"');
                break;
                
            case 'wpf':
                declarations.push('xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"');
                declarations.push('xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
                declarations.push('xmlns:d="http://schemas.microsoft.com/expression/blend/2008"');
                declarations.push('xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"');
                declarations.push('mc:Ignorable="d"');
                break;
                
            case 'maui':
                declarations.push('xmlns="http://schemas.microsoft.com/dotnet/2021/maui"');
                declarations.push('xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"');
                break;
                
            case 'uwp':
                declarations.push('xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"');
                declarations.push('xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
                declarations.push('xmlns:d="http://schemas.microsoft.com/expression/blend/2008"');
                declarations.push('xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"');
                declarations.push('mc:Ignorable="d"');
                break;
                
            default:
                // Default to Avalonia
                declarations.push('xmlns="https://github.com/avaloniaui"');
                declarations.push('xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"');
        }
        
        // Add local namespace if specified
        if (options.namespace) {
            declarations.push(`xmlns:local="clr-namespace:${options.namespace}"`);
        }
        
        return declarations;
    }
    
    /**
     * Generate resources section
     * @private
     */
    _generateResources(options) {
        const lines = [];
        const rootType = options.rootType || 'UserControl';
        const indent = this.indent(1);
        
        lines.push(`${indent}<${rootType}.Resources>`);
        
        // Add collected resources
        for (const [key, resource] of this._resourceMap) {
            if (resource.type === 'brush') {
                lines.push(`${indent}${this.indent(1)}<SolidColorBrush x:Key="${key}" Color="${resource.color}"/>`);
            } else if (resource.type === 'style') {
                lines.push(`${indent}${this.indent(1)}${resource.xaml}`);
            }
        }
        
        lines.push(`${indent}</${rootType}.Resources>`);
        lines.push('');
        
        return lines.join('\n');
    }
    
    /**
     * Reset engine state
     */
    reset() {
        this._resourceMap.clear();
        this._styleMap.clear();
        this.layoutEngine.reset();
    }
}

// ==========================================
// EXPORT
// ==========================================

export default XAMLContainerExportEngine;
