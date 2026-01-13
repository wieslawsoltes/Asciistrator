# Asciistrator File Format Analysis & Figma Compatibility

## Executive Summary

This document analyzes the current Asciistrator native file format (`.ascii`) and compares it with Figma's JSON structure to identify gaps and required changes for better interoperability.

---

## Table of Contents

1. [Current Format Structure](#1-current-format-structure)
2. [Figma Format Structure](#2-figma-format-structure)
3. [Gap Analysis](#3-gap-analysis)
4. [Proposed Format v2.0](#4-proposed-format-v20)
5. [Migration Strategy](#5-migration-strategy)
6. [Implementation Checklist](#6-implementation-checklist)

---

## 1. Current Format Structure

### 1.1 Top-Level Document Structure

```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Untitled",
    "author": "",
    "created": "2024-01-01T00:00:00Z",
    "modified": "2024-01-01T00:00:00Z",
    "description": ""
  },
  "document": {
    "width": 120,
    "height": 60,
    "charSet": "unicode",
    "backgroundColor": "#1a1a2e"
  },
  "layers": [...],
  "objects": [...],
  "symbols": [...],
  "styles": {},
  "componentLibraries": [...]
}
```

### 1.2 Current Layer Structure

```json
{
  "id": 0,
  "name": "Layer 1",
  "visible": true,
  "locked": false,
  "opacity": 1,
  "blendMode": "normal"
}
```

### 1.3 Current Object Structure (SceneObject.toJSON())

```json
{
  "id": "uuid",
  "type": "rectangle",
  "name": "Object Name",
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 50,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  
  "strokeChar": "*",
  "fillChar": "",
  "strokeColor": null,
  "fillColor": null,
  "lineStyle": "single",
  "visible": true,
  "locked": false,
  "opacity": 1,
  
  "blendMode": "normal",
  "stroke": {
    "color": null,
    "weight": 1,
    "align": "center",
    "cap": "none",
    "join": "miter",
    "dashPattern": [],
    "dashOffset": 0,
    "miterLimit": 4,
    "visible": true,
    "opacity": 1
  },
  "fills": [],
  "effects": [],
  "cornerRadius": {
    "topLeft": 0,
    "topRight": 0,
    "bottomRight": 0,
    "bottomLeft": 0,
    "independent": false
  },
  "exportSettings": [],
  
  "layerId": 0,
  "parentId": null,
  
  "autoLayout": {
    "enabled": false,
    "direction": "vertical",
    "spacing": 1,
    "padding": { "top": 1, "right": 1, "bottom": 1, "left": 1 },
    "alignment": "start",
    "distribution": "packed",
    "wrap": false,
    "wrapSpacing": 1,
    "reversed": false
  },
  
  "sizing": {
    "horizontal": "fixed",
    "vertical": "fixed",
    "minWidth": null,
    "maxWidth": null,
    "minHeight": null,
    "maxHeight": null
  },
  
  "clipContent": false,
  
  "constraints": {
    "horizontal": "left",
    "vertical": "top"
  },
  
  "_layoutSizing": {
    "horizontal": "fixed",
    "vertical": "fixed"
  },
  
  "children": []
}
```

### 1.4 Issues with Current Format

| Issue | Description | Impact |
|-------|-------------|--------|
| **Flat object storage** | Objects stored in root `objects[]` array, not nested | ❌ Loses hierarchy on save/load |
| **Layer-object relationship** | Uses `layerId` reference | ⚠️ Different from Figma's nested pages |
| **Missing component instances** | No support for component instances | ❌ Can't reference master components |
| **Missing styles** | `styles` object empty/unused | ❌ No shared style system |
| **Missing layout item properties** | `_layoutSizing` prefixed as private | ⚠️ Internal naming convention |
| **No absolute bounds** | Missing `absoluteBoundingBox` | ⚠️ Required for Figma compatibility |
| **No transform matrix** | Uses rotation/scale separately | ⚠️ Less flexible than matrix |
| **Private properties saved** | `_boundsCache`, `_cachedParent` | ❌ Implementation details in file |

---

## 2. Figma Format Structure

### 2.1 Figma Document Structure

```json
{
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "children": [
      {
        "id": "0:1",
        "name": "Page 1",
        "type": "CANVAS",
        "backgroundColor": { "r": 0.9, "g": 0.9, "b": 0.9, "a": 1 },
        "children": [/* frames, groups, shapes */]
      }
    ]
  },
  "components": {
    "1:2": { /* component definition */ }
  },
  "componentSets": {
    "1:3": { /* variant container */ }
  },
  "styles": {
    "1:4": { /* fill/stroke/text style */ }
  },
  "schemaVersion": 0,
  "name": "File Name",
  "lastModified": "2024-01-01T00:00:00Z",
  "version": "1234567890"
}
```

### 2.2 Figma Node Common Properties

```json
{
  "id": "1:2",
  "name": "Node Name",
  "type": "RECTANGLE",
  "visible": true,
  "locked": false,
  "opacity": 1,
  
  "absoluteBoundingBox": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 50
  },
  
  "absoluteRenderBounds": {
    "x": -2,
    "y": -2,
    "width": 104,
    "height": 54
  },
  
  "relativeTransform": [
    [1, 0, 0],
    [0, 1, 0]
  ],
  
  "constraints": {
    "horizontal": "MIN",
    "vertical": "MIN"
  },
  
  "fills": [
    {
      "type": "SOLID",
      "visible": true,
      "opacity": 1,
      "blendMode": "NORMAL",
      "color": { "r": 1, "g": 0.5, "b": 0, "a": 1 }
    }
  ],
  
  "strokes": [
    {
      "type": "SOLID",
      "visible": true,
      "opacity": 1,
      "blendMode": "NORMAL",
      "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
    }
  ],
  
  "strokeWeight": 1,
  "strokeAlign": "CENTER",
  "strokeCap": "NONE",
  "strokeJoin": "MITER",
  "dashPattern": [],
  "miterLimit": 4,
  
  "effects": [],
  "blendMode": "NORMAL",
  
  "exportSettings": [],
  "isMask": false
}
```

### 2.3 Figma Frame/Auto Layout Properties

```json
{
  "type": "FRAME",
  "clipsContent": true,
  "background": [],
  "backgroundColor": { "r": 1, "g": 1, "b": 1, "a": 1 },
  
  "layoutMode": "VERTICAL",
  "primaryAxisSizingMode": "AUTO",
  "counterAxisSizingMode": "FIXED",
  "primaryAxisAlignItems": "MIN",
  "counterAxisAlignItems": "MIN",
  "paddingLeft": 0,
  "paddingRight": 0,
  "paddingTop": 0,
  "paddingBottom": 0,
  "itemSpacing": 0,
  "counterAxisSpacing": 0,
  "layoutWrap": "NO_WRAP",
  "itemReverseZIndex": false,
  "strokesIncludedInLayout": false,
  
  "layoutAlign": "INHERIT",
  "layoutGrow": 0,
  "layoutPositioning": "AUTO",
  
  "minWidth": null,
  "maxWidth": null,
  "minHeight": null,
  "maxHeight": null,
  
  "children": []
}
```

### 2.4 Figma Component & Instance

```json
// Component Definition
{
  "id": "1:2",
  "type": "COMPONENT",
  "name": "Button",
  "description": "Primary button component",
  "componentPropertyDefinitions": {
    "Label": {
      "type": "TEXT",
      "defaultValue": "Button"
    },
    "State": {
      "type": "VARIANT",
      "variantOptions": ["Default", "Hover", "Pressed"]
    }
  },
  "children": []
}

// Component Instance
{
  "id": "1:3",
  "type": "INSTANCE",
  "name": "Button Instance",
  "componentId": "1:2",
  "componentProperties": {
    "Label": { "type": "TEXT", "value": "Submit" },
    "State": { "type": "VARIANT", "value": "Default" }
  },
  "overrides": [],
  "children": []
}
```

---

## 3. Gap Analysis

### 3.1 Structural Gaps

| Feature | Asciistrator | Figma | Gap Level | Action Required |
|---------|-------------|-------|-----------|-----------------|
| **Document hierarchy** | Flat (layers + objects) | Nested tree | 🔴 Critical | Restructure to nested pages/frames |
| **Page concept** | None (single canvas) | CANVAS nodes | 🟡 Medium | Add pages array |
| **Component definitions** | Separate file | In document | 🔴 Critical | Move components inline |
| **Component instances** | Not supported | INSTANCE type | 🔴 Critical | Add instance type |
| **Style definitions** | Unused | Shared styles | 🟡 Medium | Implement style refs |
| **Object nesting** | `children[]` in objects | `children[]` | ✅ Match | Already compatible |

### 3.2 Property Gaps

| Property | Asciistrator | Figma | Gap Level | Action Required |
|----------|-------------|-------|-----------|-----------------|
| **Position** | `x, y` | `absoluteBoundingBox` | 🟡 Medium | Add absolute bounds |
| **Transform** | `rotation, scaleX, scaleY` | `relativeTransform` matrix | 🟡 Medium | Support both |
| **Constraints** | `left/right/leftRight/center/scale` | `MIN/MAX/STRETCH/CENTER/SCALE` | ✅ Match | Just rename |
| **Auto Layout** | `autoLayout` object | Flat properties | 🟡 Medium | Support both |
| **Sizing** | `sizing` object | `primaryAxisSizingMode` etc | 🟡 Medium | Map properties |
| **Fills** | Array of fills | Array of fills | ✅ Match | Format colors |
| **Strokes** | Single stroke object | Array of strokes | 🟡 Medium | Convert to array |
| **Effects** | Array | Array | ✅ Match | Already compatible |
| **Corner radius** | Object with 4 corners | `cornerRadius` or array | ✅ Match | Already compatible |

### 3.3 Type Mapping Gaps

| Asciistrator Type | Figma Type | Notes |
|-------------------|------------|-------|
| `rectangle` | `RECTANGLE` | ✅ Direct map |
| `ellipse` | `ELLIPSE` | ✅ Direct map |
| `line` | `LINE` | ✅ Direct map |
| `text` | `TEXT` | ✅ Direct map |
| `ascii-text` | `TEXT` | ⚠️ Custom type, export as TEXT |
| `path` | `VECTOR` | ⚠️ Different command format |
| `polygon` | `REGULAR_POLYGON` | ✅ Direct map |
| `star` | `STAR` | ✅ Direct map |
| `group` | `GROUP` | ✅ Direct map |
| `frame` | `FRAME` | ✅ Direct map |
| `table` | N/A | ❌ Custom type |
| `chart` | N/A | ❌ Custom type |
| `process` etc. | `RECTANGLE` + custom | ⚠️ Export as shapes |
| `connector` | `CONNECTOR` (FigJam) | ⚠️ Only in FigJam |

### 3.4 Missing Figma Features

| Feature | Priority | Implementation Effort |
|---------|----------|----------------------|
| Component variants | High | Medium |
| Boolean operations (stored) | Medium | High |
| Vector networks | Low | Very High |
| Prototype links | Low | Medium |
| Comments | Low | Low |
| Dev mode annotations | Low | Medium |

---

## 4. Proposed Format v2.0

### 4.1 New Document Structure

```json
{
  "version": "2.0.0",
  "schemaVersion": 0,
  
  "name": "Document Name",
  "lastModified": "2024-01-01T00:00:00Z",
  
  "document": {
    "id": "0:0",
    "type": "DOCUMENT",
    "name": "Document",
    "children": [
      {
        "id": "page:1",
        "type": "PAGE",
        "name": "Page 1",
        "backgroundColor": { "r": 0.1, "g": 0.1, "b": 0.18, "a": 1 },
        "canvasWidth": 120,
        "canvasHeight": 60,
        "charSet": "unicode",
        "children": [/* frames, objects */]
      }
    ]
  },
  
  "components": {
    "comp:1": {
      "id": "comp:1",
      "type": "COMPONENT",
      "name": "Button",
      "description": "",
      "key": "abc123",
      "children": []
    }
  },
  
  "componentSets": {},
  
  "styles": {
    "style:fill:1": {
      "key": "abc124",
      "name": "Primary",
      "styleType": "FILL",
      "description": ""
    }
  },
  
  "metadata": {
    "title": "Document Name",
    "author": "",
    "created": "2024-01-01T00:00:00Z",
    "description": "",
    "tags": [],
    "exportVersion": "Asciistrator 2.0"
  }
}
```

### 4.2 New Node Structure (Figma-Compatible)

```json
{
  "id": "1:2",
  "type": "FRAME",
  "name": "Container",
  "visible": true,
  "locked": false,
  
  "absoluteBoundingBox": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 50
  },
  
  "relativeTransform": [[1, 0, 0], [0, 1, 0]],
  
  "size": {
    "x": 100,
    "y": 50
  },
  
  "opacity": 1,
  "blendMode": "NORMAL",
  
  "fills": [
    {
      "type": "SOLID",
      "visible": true,
      "opacity": 1,
      "blendMode": "NORMAL",
      "color": { "r": 1, "g": 1, "b": 1, "a": 1 }
    }
  ],
  
  "strokes": [
    {
      "type": "SOLID",
      "visible": true,
      "opacity": 1,
      "color": { "r": 0, "g": 0, "b": 0, "a": 1 }
    }
  ],
  
  "strokeWeight": 1,
  "strokeAlign": "CENTER",
  "strokeCap": "NONE",
  "strokeJoin": "MITER",
  "strokeDashes": [],
  "strokeMiterAngle": 28.96,
  
  "cornerRadius": 0,
  "rectangleCornerRadii": [0, 0, 0, 0],
  
  "effects": [],
  
  "constraints": {
    "horizontal": "MIN",
    "vertical": "MIN"
  },
  
  "clipsContent": true,
  
  "layoutMode": "VERTICAL",
  "primaryAxisSizingMode": "FIXED",
  "counterAxisSizingMode": "FIXED",
  "primaryAxisAlignItems": "MIN",
  "counterAxisAlignItems": "MIN",
  "paddingLeft": 1,
  "paddingRight": 1,
  "paddingTop": 1,
  "paddingBottom": 1,
  "itemSpacing": 1,
  "counterAxisSpacing": 0,
  "layoutWrap": "NO_WRAP",
  "itemReverseZIndex": false,
  
  "layoutAlign": "INHERIT",
  "layoutGrow": 0,
  "layoutPositioning": "AUTO",
  
  "minWidth": null,
  "maxWidth": null,
  "minHeight": null,
  "maxHeight": null,
  
  "children": [],
  
  "ascii": {
    "strokeChar": "*",
    "fillChar": " ",
    "lineStyle": "single",
    "boxStyle": "single",
    "backgroundColor": null
  }
}
```

### 4.3 Constraint Value Mapping

| Asciistrator v1 | Figma | Asciistrator v2 |
|-----------------|-------|-----------------|
| `left` | `MIN` | `MIN` |
| `right` | `MAX` | `MAX` |
| `leftRight` | `STRETCH` | `STRETCH` |
| `center` | `CENTER` | `CENTER` |
| `scale` | `SCALE` | `SCALE` |
| `top` | `MIN` | `MIN` |
| `bottom` | `MAX` | `MAX` |
| `topBottom` | `STRETCH` | `STRETCH` |

### 4.4 Layout Mode Mapping

| Asciistrator v1 | Figma | Asciistrator v2 |
|-----------------|-------|-----------------|
| `autoLayout.enabled: false` | `layoutMode: "NONE"` | `layoutMode: "NONE"` |
| `autoLayout.direction: "horizontal"` | `layoutMode: "HORIZONTAL"` | `layoutMode: "HORIZONTAL"` |
| `autoLayout.direction: "vertical"` | `layoutMode: "VERTICAL"` | `layoutMode: "VERTICAL"` |

### 4.5 Sizing Mode Mapping

| Asciistrator v1 | Figma | Asciistrator v2 |
|-----------------|-------|-----------------|
| `sizing.horizontal: "fixed"` | `primaryAxisSizingMode: "FIXED"` | `FIXED` |
| `sizing.horizontal: "hug"` | `primaryAxisSizingMode: "AUTO"` | `AUTO` |
| `sizing.horizontal: "fill"` | Child: `layoutGrow: 1` | `layoutGrow: 1` |

### 4.6 Component Instance Structure

```json
{
  "id": "inst:1",
  "type": "INSTANCE",
  "name": "Button Instance",
  "componentId": "comp:1",
  
  "absoluteBoundingBox": { "x": 50, "y": 100, "width": 80, "height": 32 },
  
  "componentProperties": {
    "Label#text": { "type": "TEXT", "value": "Submit" }
  },
  
  "overrides": [
    {
      "id": "text:1",
      "overriddenFields": ["characters"]
    }
  ],
  
  "children": [],
  
  "ascii": {
    "strokeChar": "*",
    "fillChar": " "
  }
}
```

### 4.7 Color Format

```json
{
  "fills": [
    {
      "type": "SOLID",
      "color": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 }
    },
    {
      "type": "GRADIENT_LINEAR",
      "gradientHandlePositions": [
        { "x": 0, "y": 0.5 },
        { "x": 1, "y": 0.5 }
      ],
      "gradientStops": [
        { "position": 0, "color": { "r": 1, "g": 0, "b": 0, "a": 1 } },
        { "position": 1, "color": { "r": 0, "g": 0, "b": 1, "a": 1 } }
      ]
    }
  ]
}
```

**Note:** Figma uses 0-1 RGB values, Asciistrator currently uses hex strings.

---

## 5. Migration Strategy

### 5.1 Version Detection

```javascript
function detectVersion(data) {
  // v2+ has nested document structure
  if (data.document?.type === 'DOCUMENT') {
    return data.version || '2.0.0';
  }
  // v1 has flat layers/objects arrays
  if (data.layers && data.objects) {
    return data.version || '1.0.0';
  }
  // Unknown format
  return null;
}
```

### 5.2 Migration: v1 → v2

```javascript
function migrateV1ToV2(v1Data) {
  const v2Data = {
    version: '2.0.0',
    schemaVersion: 0,
    name: v1Data.metadata?.title || 'Untitled',
    lastModified: v1Data.metadata?.modified || new Date().toISOString(),
    
    document: {
      id: '0:0',
      type: 'DOCUMENT',
      name: 'Document',
      children: []
    },
    
    components: {},
    componentSets: {},
    styles: {},
    
    metadata: v1Data.metadata || {}
  };
  
  // Convert layers to pages
  for (const layer of v1Data.layers || []) {
    const page = {
      id: `page:${layer.id}`,
      type: 'PAGE',
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      backgroundColor: hexToFigmaColor(v1Data.document?.backgroundColor),
      canvasWidth: v1Data.document?.width || 120,
      canvasHeight: v1Data.document?.height || 60,
      charSet: v1Data.document?.charSet || 'unicode',
      children: []
    };
    
    // Find objects for this layer
    const layerObjects = (v1Data.objects || []).filter(
      obj => obj.layerId === layer.id
    );
    
    // Convert objects to v2 format
    for (const obj of layerObjects) {
      page.children.push(convertObjectV1ToV2(obj));
    }
    
    v2Data.document.children.push(page);
  }
  
  // Convert component libraries
  for (const lib of v1Data.componentLibraries || []) {
    for (const comp of lib.components || []) {
      v2Data.components[comp.id] = convertComponentV1ToV2(comp);
    }
  }
  
  return v2Data;
}
```

### 5.3 Object Conversion

```javascript
function convertObjectV1ToV2(v1Obj) {
  const v2Obj = {
    id: v1Obj.id,
    type: mapTypeV1ToV2(v1Obj.type),
    name: v1Obj.name || v1Obj.type,
    visible: v1Obj.visible !== false,
    locked: v1Obj.locked || false,
    
    absoluteBoundingBox: {
      x: v1Obj.x || 0,
      y: v1Obj.y || 0,
      width: v1Obj.width || 1,
      height: v1Obj.height || 1
    },
    
    relativeTransform: computeTransformMatrix(v1Obj),
    
    opacity: v1Obj.opacity ?? 1,
    blendMode: (v1Obj.blendMode || 'normal').toUpperCase(),
    
    fills: convertFillsV1ToV2(v1Obj),
    strokes: convertStrokesV1ToV2(v1Obj),
    
    strokeWeight: v1Obj.stroke?.weight || 1,
    strokeAlign: (v1Obj.stroke?.align || 'center').toUpperCase(),
    
    effects: v1Obj.effects || [],
    
    constraints: {
      horizontal: mapConstraintV1ToV2(v1Obj.constraints?.horizontal || 'left'),
      vertical: mapConstraintV1ToV2(v1Obj.constraints?.vertical || 'top')
    },
    
    children: (v1Obj.children || []).map(convertObjectV1ToV2),
    
    // Preserve ASCII-specific properties
    ascii: {
      strokeChar: v1Obj.strokeChar || '*',
      fillChar: v1Obj.fillChar || '',
      lineStyle: v1Obj.lineStyle || 'single'
    }
  };
  
  // Add layout properties for frames
  if (v1Obj.autoLayout?.enabled || v1Obj.type === 'frame') {
    Object.assign(v2Obj, convertAutoLayoutV1ToV2(v1Obj));
  }
  
  // Add type-specific properties
  addTypeSpecificProperties(v1Obj, v2Obj);
  
  return v2Obj;
}

function mapTypeV1ToV2(type) {
  const typeMap = {
    'rectangle': 'RECTANGLE',
    'ellipse': 'ELLIPSE',
    'line': 'LINE',
    'text': 'TEXT',
    'ascii-text': 'TEXT',
    'path': 'VECTOR',
    'polygon': 'REGULAR_POLYGON',
    'star': 'STAR',
    'group': 'GROUP',
    'frame': 'FRAME',
    'table': 'FRAME',  // Tables become frames
    'chart': 'FRAME',  // Charts become frames
    // Flowchart shapes become rectangles with metadata
    'process': 'RECTANGLE',
    'terminal': 'RECTANGLE',
    'decision': 'RECTANGLE',
    'io': 'RECTANGLE',
    'document': 'RECTANGLE',
    'database': 'RECTANGLE',
    'subprocess': 'RECTANGLE',
    'connector': 'LINE'
  };
  return typeMap[type] || 'RECTANGLE';
}

function mapConstraintV1ToV2(constraint) {
  const map = {
    'left': 'MIN',
    'right': 'MAX',
    'leftRight': 'STRETCH',
    'center': 'CENTER',
    'scale': 'SCALE',
    'top': 'MIN',
    'bottom': 'MAX',
    'topBottom': 'STRETCH'
  };
  return map[constraint] || 'MIN';
}
```

### 5.4 Backward Compatibility

```javascript
async function loadDocument(input) {
  const data = JSON.parse(input);
  const version = detectVersion(data);
  
  switch (version) {
    case '1.0.0':
      console.log('Migrating v1 document to v2');
      return migrateV1ToV2(data);
    case '2.0.0':
      return data;
    default:
      throw new Error(`Unknown document version: ${version}`);
  }
}
```

---

## 6. Implementation Checklist

### 6.1 Phase 1: Core Format Changes

- [x] **Create v2 document schema**
  - [x] Define PAGE type node
  - [x] Update document structure to nested tree
  - [x] Add `absoluteBoundingBox` to all objects
  - [ ] Add `relativeTransform` matrix support

- [x] **Update NativeDocument class**
  - [x] Add version detection
  - [x] Implement v1 → v2 migration (v1 removed, v2 only)
  - [x] Update `serializeObject()` for v2 format
  - [x] Update `fromJSON()` to handle v2 format

- [x] **Update SceneObject serialization**
  - [x] Rename constraints to Figma values (MIN, MAX, STRETCH, CENTER, SCALE)
  - [x] Convert colors to Figma format (0-1 RGBA)
  - [x] Add `ascii` namespace for ASCII-specific properties
  - [x] Remove private properties from output

### 6.2 Phase 2: Layout & Constraints

- [x] **Flatten auto layout properties**
  - [x] `layoutMode` instead of `autoLayout.enabled/direction`
  - [x] Individual padding properties (paddingLeft, paddingRight, paddingTop, paddingBottom)
  - [x] `itemSpacing` instead of `spacing`
  - [x] `layoutWrap` enum (NO_WRAP, WRAP)

- [x] **Update sizing properties**
  - [x] `primaryAxisSizingMode` / `counterAxisSizingMode` (FIXED, AUTO)
  - [x] `layoutAlign` for children (INHERIT, MIN, MAX, CENTER, STRETCH, BASELINE)
  - [x] `layoutGrow` for fill behavior (0 or 1)
  - [x] `layoutPositioning` for absolute positioning

- [x] **Constraint value migration**
  - [x] Map old constraint names to Figma equivalents (left→MIN, right→MAX, etc.)
  - [x] Update UI to show Figma-style names

### 6.3 Phase 3: Components

- [x] **Inline component storage**
  - [x] Add `components` object to document
  - [x] Convert ComponentLibrary to document components
  - [x] Support external library references

- [x] **Component instances**
  - [x] Add INSTANCE type
  - [x] Implement `componentId` reference
  - [x] Support property overrides
  - [x] Handle instance detach

### 6.4 Phase 4: Styles

- [x] **Shared styles**
  - [x] Add `styles` object to document
  - [x] Implement fill styles
  - [x] Implement stroke styles
  - [x] Implement text styles
  - [x] Implement effect styles
  - [x] Add style references to objects
  - [x] Add style application helper methods
  - [x] Save/load styles with documents

### 6.5 Phase 5: Testing & Migration

- [x] **Unit tests**
  - [x] Styles system tests (tests/unit/styles.test.js)
  - [x] Object type serialization tests (tests/unit/serialization.test.js)
  - [x] Component serialization tests
  - [x] Round-trip tests (save → load → save)
  - [x] Double round-trip tests (multiple cycles)
  - [x] Constraint value tests
  - [x] Color conversion tests
  - [x] Type mapping tests

- [ ] **Figma import/export tests**
  - [ ] Import Figma JSON, save as v2
  - [ ] Export v2, import into Figma (via plugin)
  - [ ] Verify layout preservation
  - [ ] Verify constraint preservation

---

## Appendix A: Full Type Reference

### A.1 Asciistrator v2 Types

```typescript
type NodeType = 
  | 'DOCUMENT'
  | 'PAGE'           // Asciistrator-specific (maps to CANVAS)
  | 'FRAME'
  | 'GROUP'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'LINE'
  | 'REGULAR_POLYGON'
  | 'STAR'
  | 'VECTOR'
  | 'TEXT'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION'
  // ASCII-specific (non-Figma)
  | 'TABLE'
  | 'CHART'
  | 'FLOWCHART_CONNECTOR';

type ConstraintType = 'MIN' | 'MAX' | 'STRETCH' | 'CENTER' | 'SCALE';

type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';

type SizingMode = 'FIXED' | 'AUTO';  // AUTO = hug contents

type LayoutAlign = 'INHERIT' | 'MIN' | 'MAX' | 'CENTER' | 'STRETCH' | 'BASELINE';

type LayoutWrap = 'NO_WRAP' | 'WRAP';

type BlendMode = 
  | 'NORMAL'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'OVERLAY'
  | 'DARKEN'
  | 'LIGHTEN'
  | 'COLOR_DODGE'
  | 'COLOR_BURN'
  | 'HARD_LIGHT'
  | 'SOFT_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

type StrokeAlign = 'CENTER' | 'INSIDE' | 'OUTSIDE';
type StrokeCap = 'NONE' | 'ROUND' | 'SQUARE' | 'LINE_ARROW' | 'TRIANGLE_ARROW';
type StrokeJoin = 'MITER' | 'BEVEL' | 'ROUND';
```

### A.2 Color Format

```typescript
interface Color {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
  a: number;  // 0-1
}

// Conversion utilities
function hexToFigma(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: 1
  } : { r: 0, g: 0, b: 0, a: 1 };
}

function figmaToHex(color: Color): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
```

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Author: Asciistrator Development Team*
