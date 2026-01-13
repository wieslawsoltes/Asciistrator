# Figma Integration Specification

## Executive Summary

This document outlines the specification and implementation plan for bidirectional Figma file format integration with Asciistrator. Due to Figma's proprietary binary format (.fig), we will implement integration through:

1. **Figma REST API** - For importing Figma designs
2. **SVG Export** - For basic export to Figma
3. **Figma Plugin** - For advanced bidirectional sync (optional companion)
4. **Figma JSON Format** - Native parsing of Figma's internal JSON structure

---

## Table of Contents

1. [Figma Format Analysis](#1-figma-format-analysis)
2. [Import from Figma](#2-import-from-figma)
3. [Export to Figma](#3-export-to-figma)
4. [Data Model Mapping](#4-data-model-mapping)
5. [Implementation Plan](#5-implementation-plan)
6. [API Reference](#6-api-reference)
7. [Limitations & Considerations](#7-limitations--considerations)

---

## 1. Figma Format Analysis

### 1.1 Figma File Types

| Format | Extension | Access Method | Feasibility |
|--------|-----------|---------------|-------------|
| Native Binary | `.fig` | Proprietary (not accessible) | ❌ Not possible |
| REST API JSON | N/A | HTTP GET with token | ✅ Full support |
| Plugin API | N/A | Figma Plugin Runtime | ✅ With plugin |
| Exported SVG | `.svg` | Standard SVG parsing | ✅ Full support |
| Exported PNG | `.png` | Image import | ⚠️ Rasterized only |

### 1.2 Figma REST API JSON Structure

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
        "children": [...]
      }
    ]
  },
  "components": {},
  "componentSets": {},
  "schemaVersion": 0,
  "styles": {},
  "name": "File Name",
  "lastModified": "2024-01-01T00:00:00Z",
  "version": "123456789"
}
```

### 1.3 Figma Node Types

| Figma Type | Asciistrator Equivalent | Conversion Complexity |
|------------|------------------------|----------------------|
| FRAME | FrameObject | Low |
| GROUP | SceneObject (group) | Low |
| RECTANGLE | RectangleObject | Low |
| ELLIPSE | EllipseObject | Low |
| LINE | LineObject | Low |
| POLYGON | PolygonObject | Medium |
| STAR | StarObject | Medium |
| VECTOR | PathObject | High |
| TEXT | TextObject | Medium |
| COMPONENT | Component Instance | Medium |
| INSTANCE | Component Instance | Medium |
| BOOLEAN_OPERATION | Boolean Result | High |
| SLICE | N/A (skip) | N/A |

---

## 2. Import from Figma

### 2.1 Import Methods

#### Method A: REST API Import (Recommended)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Figma Cloud   │────▶│  REST API GET   │────▶│  Asciistrator   │
│   (File ID)     │     │  (JSON Response)│     │  (Parse & Map)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Requirements:**
- Figma Personal Access Token
- File ID or URL
- Network access to api.figma.com

#### Method B: JSON File Import

Users can export Figma file structure via:
1. Figma Plugin (custom exporter)
2. Copy from Figma API response
3. Third-party tools

### 2.2 Import Process Flow

```
1. User provides Figma file URL or ID + API token
2. Fetch file data from Figma REST API
3. Parse JSON response
4. Traverse node tree
5. Map Figma nodes to Asciistrator objects
6. Apply transformations, styles, and constraints
7. Build layer hierarchy
8. Render imported design
```

### 2.3 Import Configuration Options

```javascript
const importConfig = {
  // Source
  fileId: 'abc123',           // Figma file ID
  accessToken: 'figd_...',    // Personal access token
  nodeIds: [],                // Specific nodes to import (empty = all)
  
  // Mapping options
  convertVectorsToPath: true, // Convert VECTOR nodes to PathObject
  flattenBooleans: true,      // Flatten boolean operations
  importImages: true,         // Download and embed images
  importComponents: true,     // Import component definitions
  
  // ASCII conversion
  asciiWidth: 200,            // Target ASCII width
  asciiHeight: 100,           // Target ASCII height
  preserveAspectRatio: true,  // Maintain proportions
  scaleFactor: 'auto',        // Auto-calculate or specify
  
  // Style mapping
  strokeCharMapping: {
    'default': '*',
    'dashed': '-',
    'dotted': '.'
  },
  fillCharMapping: {
    'solid': '#',
    'gradient': '░▒▓',
    'transparent': ' '
  }
};
```

### 2.4 Node Import Implementation

```javascript
class FigmaImporter {
  async importFromAPI(fileId, accessToken) {
    const response = await fetch(
      `https://api.figma.com/v1/files/${fileId}`,
      { headers: { 'X-Figma-Token': accessToken } }
    );
    const data = await response.json();
    return this.parseDocument(data.document);
  }
  
  parseDocument(doc) {
    const result = {
      pages: [],
      components: new Map(),
      styles: new Map()
    };
    
    for (const page of doc.children) {
      if (page.type === 'CANVAS') {
        result.pages.push(this.parsePage(page));
      }
    }
    
    return result;
  }
  
  parseNode(node) {
    switch (node.type) {
      case 'FRAME': return this.parseFrame(node);
      case 'GROUP': return this.parseGroup(node);
      case 'RECTANGLE': return this.parseRectangle(node);
      case 'ELLIPSE': return this.parseEllipse(node);
      case 'LINE': return this.parseLine(node);
      case 'TEXT': return this.parseText(node);
      case 'VECTOR': return this.parseVector(node);
      case 'POLYGON': return this.parsePolygon(node);
      case 'STAR': return this.parseStar(node);
      case 'COMPONENT': return this.parseComponent(node);
      case 'INSTANCE': return this.parseInstance(node);
      default: return null;
    }
  }
}
```

---

## 3. Export to Figma

### 3.1 Export Methods

#### Method A: SVG Export (Simple)

Export Asciistrator design as SVG, which Figma can import natively.

**Pros:**
- No authentication required
- Works with any Figma plan
- Preserves vector shapes

**Cons:**
- Loses Auto Layout information
- Loses component relationships
- Loses constraints
- ASCII characters become text objects

#### Method B: Figma JSON Export (Advanced)

Export to Figma's JSON structure for import via custom plugin.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Asciistrator   │────▶│  JSON Export    │────▶│  Figma Plugin   │
│  (Objects)      │     │  (Figma Format) │     │  (Import JSON)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### Method C: REST API Export (Create/Update)

Use Figma Plugin API or experimental endpoints to create nodes.

**Note:** Figma REST API is primarily read-only. Write operations require a plugin.

### 3.2 Export Process Flow

```
1. Select objects/frames to export
2. Choose export format (SVG or Figma JSON)
3. Map Asciistrator objects to Figma nodes
4. Generate output file/data
5. For JSON: Provide instructions for Figma plugin import
6. For SVG: Direct download
```

### 3.3 Export Configuration Options

```javascript
const exportConfig = {
  // Output format
  format: 'figma-json', // 'figma-json' | 'svg' | 'svg-optimized'
  
  // Content selection
  selection: 'all',     // 'all' | 'selected' | 'frame'
  frameId: null,        // Specific frame ID if selection='frame'
  
  // Figma JSON options
  includeAutoLayout: true,
  includeConstraints: true,
  includeComponents: true,
  includeStyles: true,
  
  // ASCII to Vector conversion
  textRendering: 'paths', // 'paths' | 'text' | 'monospace'
  fontFamily: 'monospace',
  fontSize: 12,
  charWidth: 8,
  charHeight: 16,
  
  // Style export
  preserveColors: true,
  defaultStrokeWidth: 1,
  defaultStrokeColor: '#000000',
  defaultFillColor: '#FFFFFF'
};
```

### 3.4 Figma JSON Node Generation

```javascript
class FigmaExporter {
  exportToFigmaJSON(objects) {
    return {
      document: {
        id: '0:0',
        name: 'Asciistrator Export',
        type: 'DOCUMENT',
        children: [
          {
            id: '0:1',
            name: 'Page 1',
            type: 'CANVAS',
            backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
            children: objects.map(obj => this.convertNode(obj))
          }
        ]
      },
      schemaVersion: 0
    };
  }
  
  convertNode(obj) {
    const base = {
      id: this.generateId(),
      name: obj.name || obj.type,
      visible: obj.visible,
      locked: obj.locked,
      opacity: obj.opacity
    };
    
    switch (obj.type) {
      case 'frame':
        return this.convertFrame(obj, base);
      case 'rectangle':
        return this.convertRectangle(obj, base);
      case 'ellipse':
        return this.convertEllipse(obj, base);
      // ... etc
    }
  }
}
```

---

## 4. Data Model Mapping

### 4.1 Geometry Mapping

| Asciistrator | Figma | Conversion Notes |
|--------------|-------|------------------|
| `x, y` | `x, y` | Direct mapping |
| `width, height` | `width, height` | Scale by char dimensions |
| `rotation` | `rotation` | Convert to degrees |
| `scaleX, scaleY` | Transform matrix | Decompose/compose |

### 4.2 Style Mapping

#### Stroke/Fill Conversion

```javascript
// Asciistrator to Figma
const strokeToFigma = (strokeChar, strokeColor) => ({
  strokes: [{
    type: 'SOLID',
    color: parseColor(strokeColor) || { r: 0, g: 0, b: 0, a: 1 },
    opacity: 1
  }],
  strokeWeight: 1,
  strokeAlign: 'CENTER'
});

// Figma to Asciistrator
const figmaToStroke = (strokes) => {
  if (!strokes || strokes.length === 0) return { char: '', color: null };
  const stroke = strokes[0];
  return {
    char: '*',
    color: rgbToHex(stroke.color)
  };
};
```

#### Fill Pattern Mapping

| Figma Fill Type | Asciistrator fillChar | Notes |
|-----------------|----------------------|-------|
| SOLID (light) | `░` | 25% density |
| SOLID (medium) | `▒` | 50% density |
| SOLID (dark) | `▓` | 75% density |
| SOLID (full) | `█` or `#` | 100% density |
| GRADIENT_LINEAR | `░▒▓` progression | Dithered approximation |
| IMAGE | Custom pattern | ASCII art conversion |

### 4.3 Auto Layout Mapping

```javascript
// Figma Auto Layout → Asciistrator
const mapAutoLayout = (figmaFrame) => ({
  enabled: figmaFrame.layoutMode !== 'NONE',
  direction: figmaFrame.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
  spacing: Math.round(figmaFrame.itemSpacing / charWidth),
  padding: {
    top: Math.round(figmaFrame.paddingTop / charHeight),
    right: Math.round(figmaFrame.paddingRight / charWidth),
    bottom: Math.round(figmaFrame.paddingBottom / charHeight),
    left: Math.round(figmaFrame.paddingLeft / charWidth)
  },
  alignment: mapAlignment(figmaFrame.primaryAxisAlignItems, figmaFrame.counterAxisAlignItems),
  wrap: figmaFrame.layoutWrap === 'WRAP'
});

// Asciistrator Auto Layout → Figma
const exportAutoLayout = (asciiLayout) => ({
  layoutMode: asciiLayout.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL',
  itemSpacing: asciiLayout.spacing * charWidth,
  paddingTop: asciiLayout.padding.top * charHeight,
  paddingRight: asciiLayout.padding.right * charWidth,
  paddingBottom: asciiLayout.padding.bottom * charHeight,
  paddingLeft: asciiLayout.padding.left * charWidth,
  primaryAxisAlignItems: mapPrimaryAlignment(asciiLayout.alignment),
  counterAxisAlignItems: mapCounterAlignment(asciiLayout.alignment),
  layoutWrap: asciiLayout.wrap ? 'WRAP' : 'NO_WRAP'
});
```

### 4.4 Constraints Mapping

```javascript
// Figma Constraints → Asciistrator
const constraintMap = {
  horizontal: {
    'MIN': 'left',
    'MAX': 'right',
    'STRETCH': 'leftRight',
    'CENTER': 'center',
    'SCALE': 'scale'
  },
  vertical: {
    'MIN': 'top',
    'MAX': 'bottom',
    'STRETCH': 'topBottom',
    'CENTER': 'center',
    'SCALE': 'scale'
  }
};
```

### 4.5 Component Mapping

```javascript
// Figma Component → Asciistrator Component
const mapComponent = (figmaComponent) => ({
  id: figmaComponent.id,
  name: figmaComponent.name,
  description: figmaComponent.description,
  properties: mapComponentProperties(figmaComponent.componentPropertyDefinitions),
  children: figmaComponent.children.map(mapNode)
});

// Figma Instance → Asciistrator Instance
const mapInstance = (figmaInstance) => ({
  componentId: figmaInstance.componentId,
  overrides: mapOverrides(figmaInstance.overrides),
  // ... position, size, etc.
});
```

---

## 5. Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

#### 5.1.1 Create Figma Integration Module

```
scripts/
  io/
    figma/
      index.js          # Main exports
      api.js            # REST API client
      parser.js         # JSON parser
      importer.js       # Import logic
      exporter.js       # Export logic
      mapper.js         # Data mapping utilities
      types.js          # TypeScript-like type definitions
```

#### 5.1.2 Implement REST API Client

```javascript
// scripts/io/figma/api.js

export class FigmaAPI {
  constructor(accessToken) {
    this.baseUrl = 'https://api.figma.com/v1';
    this.token = accessToken;
  }
  
  async getFile(fileId, options = {}) {
    const params = new URLSearchParams();
    if (options.nodeIds) params.set('ids', options.nodeIds.join(','));
    if (options.depth) params.set('depth', options.depth);
    if (options.geometry) params.set('geometry', options.geometry);
    
    const url = `${this.baseUrl}/files/${fileId}?${params}`;
    return this.request(url);
  }
  
  async getFileNodes(fileId, nodeIds) {
    const url = `${this.baseUrl}/files/${fileId}/nodes?ids=${nodeIds.join(',')}`;
    return this.request(url);
  }
  
  async getImages(fileId, nodeIds, format = 'svg', scale = 1) {
    const url = `${this.baseUrl}/images/${fileId}?ids=${nodeIds.join(',')}&format=${format}&scale=${scale}`;
    return this.request(url);
  }
  
  async request(url) {
    const response = await fetch(url, {
      headers: { 'X-Figma-Token': this.token }
    });
    
    if (!response.ok) {
      throw new FigmaAPIError(response.status, await response.text());
    }
    
    return response.json();
  }
}
```

### Phase 2: Import Implementation (Week 2-3)

#### 5.2.1 Implement Node Parsers

```javascript
// scripts/io/figma/parser.js

export class FigmaParser {
  constructor(options = {}) {
    this.options = {
      charWidth: 1,
      charHeight: 1,
      scaleFactor: 1,
      ...options
    };
  }
  
  parseDocument(figmaDoc) {
    const pages = [];
    
    for (const child of figmaDoc.children || []) {
      if (child.type === 'CANVAS') {
        pages.push(this.parsePage(child));
      }
    }
    
    return { pages };
  }
  
  parsePage(canvas) {
    return {
      id: canvas.id,
      name: canvas.name,
      backgroundColor: this.parseColor(canvas.backgroundColor),
      objects: (canvas.children || [])
        .map(node => this.parseNode(node))
        .filter(Boolean)
    };
  }
  
  parseNode(node) {
    const parser = this.nodeParsers[node.type];
    if (!parser) {
      console.warn(`Unknown node type: ${node.type}`);
      return null;
    }
    return parser.call(this, node);
  }
  
  nodeParsers = {
    FRAME: this.parseFrame,
    GROUP: this.parseGroup,
    RECTANGLE: this.parseRectangle,
    ELLIPSE: this.parseEllipse,
    LINE: this.parseLine,
    REGULAR_POLYGON: this.parsePolygon,
    STAR: this.parseStar,
    VECTOR: this.parseVector,
    TEXT: this.parseText,
    COMPONENT: this.parseComponent,
    COMPONENT_SET: this.parseComponentSet,
    INSTANCE: this.parseInstance,
    BOOLEAN_OPERATION: this.parseBooleanOperation
  };
}
```

#### 5.2.2 Implement Import Dialog

```javascript
// UI for import configuration
showFigmaImportDialog() {
  const dialog = createDialog({
    title: 'Import from Figma',
    content: `
      <div class="figma-import-form">
        <div class="form-group">
          <label>Figma File URL or ID:</label>
          <input type="text" id="figma-file-input" 
                 placeholder="https://figma.com/file/abc123/..." />
        </div>
        
        <div class="form-group">
          <label>Personal Access Token:</label>
          <input type="password" id="figma-token-input" 
                 placeholder="figd_..." />
          <a href="https://www.figma.com/developers/api#access-tokens" 
             target="_blank">Get token</a>
        </div>
        
        <div class="form-group">
          <label>Import Options:</label>
          <label><input type="checkbox" id="import-images" checked> Import images</label>
          <label><input type="checkbox" id="import-components" checked> Import components</label>
          <label><input type="checkbox" id="preserve-layout" checked> Preserve auto layout</label>
        </div>
        
        <div class="form-group">
          <label>Scale:</label>
          <select id="import-scale">
            <option value="auto">Auto-fit to canvas</option>
            <option value="1">1:1 (1 Figma unit = 1 ASCII char)</option>
            <option value="0.5">1:2 (2 Figma units = 1 ASCII char)</option>
            <option value="0.25">1:4 (4 Figma units = 1 ASCII char)</option>
          </select>
        </div>
      </div>
    `,
    buttons: [
      { label: 'Cancel', action: 'close' },
      { label: 'Import', action: 'import', primary: true }
    ]
  });
}
```

### Phase 3: Export Implementation (Week 3-4)

#### 5.3.1 Implement Figma JSON Generator

```javascript
// scripts/io/figma/exporter.js

export class FigmaExporter {
  constructor(options = {}) {
    this.options = {
      charWidth: 8,
      charHeight: 16,
      fontFamily: 'Courier New',
      ...options
    };
    this.idCounter = 0;
  }
  
  generateId() {
    return `${this.idCounter++}:${this.idCounter}`;
  }
  
  exportDocument(layers) {
    const pages = layers.map((layer, index) => ({
      id: this.generateId(),
      name: layer.name || `Page ${index + 1}`,
      type: 'CANVAS',
      backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
      children: layer.objects.map(obj => this.exportNode(obj))
    }));
    
    return {
      document: {
        id: '0:0',
        name: 'Asciistrator Export',
        type: 'DOCUMENT',
        children: pages
      },
      components: this.exportedComponents,
      styles: this.exportedStyles,
      schemaVersion: 0
    };
  }
  
  exportNode(obj) {
    const base = this.getBaseProperties(obj);
    
    switch (obj.type) {
      case 'frame': return { ...base, ...this.exportFrame(obj) };
      case 'rectangle': return { ...base, ...this.exportRectangle(obj) };
      case 'ellipse': return { ...base, ...this.exportEllipse(obj) };
      case 'line': return { ...base, ...this.exportLine(obj) };
      case 'text': return { ...base, ...this.exportText(obj) };
      case 'path': return { ...base, ...this.exportVector(obj) };
      case 'polygon': return { ...base, ...this.exportPolygon(obj) };
      case 'star': return { ...base, ...this.exportStar(obj) };
      default: return base;
    }
  }
  
  getBaseProperties(obj) {
    const { charWidth, charHeight } = this.options;
    
    return {
      id: this.generateId(),
      name: obj.name || obj.type,
      type: this.mapNodeType(obj.type),
      visible: obj.visible !== false,
      locked: obj.locked || false,
      opacity: obj.opacity ?? 1,
      absoluteBoundingBox: {
        x: obj.x * charWidth,
        y: obj.y * charHeight,
        width: (obj.width || 1) * charWidth,
        height: (obj.height || 1) * charHeight
      },
      constraints: this.exportConstraints(obj.constraints),
      fills: this.exportFills(obj),
      strokes: this.exportStrokes(obj),
      effects: this.exportEffects(obj.effects)
    };
  }
}
```

#### 5.3.2 Implement Export Dialog

```javascript
showFigmaExportDialog() {
  const dialog = createDialog({
    title: 'Export to Figma',
    content: `
      <div class="figma-export-form">
        <div class="form-group">
          <label>Export Format:</label>
          <select id="export-format">
            <option value="figma-json">Figma JSON (for plugin import)</option>
            <option value="svg">SVG (direct Figma import)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Content:</label>
          <select id="export-content">
            <option value="all">All layers</option>
            <option value="selected">Selected objects only</option>
            <option value="active-layer">Active layer only</option>
          </select>
        </div>
        
        <div class="form-group" id="json-options">
          <label>Figma JSON Options:</label>
          <label><input type="checkbox" id="export-autolayout" checked> Include Auto Layout</label>
          <label><input type="checkbox" id="export-constraints" checked> Include Constraints</label>
          <label><input type="checkbox" id="export-components" checked> Include Components</label>
        </div>
        
        <div class="form-group">
          <label>Character Dimensions:</label>
          <div class="inline-inputs">
            <input type="number" id="char-width" value="8" min="1" /> × 
            <input type="number" id="char-height" value="16" min="1" /> px
          </div>
        </div>
      </div>
    `,
    buttons: [
      { label: 'Cancel', action: 'close' },
      { label: 'Export', action: 'export', primary: true }
    ]
  });
}
```

### Phase 4: Figma Plugin (Week 4-5) - Optional

#### 5.4.1 Plugin Manifest

```json
// manifest.json
{
  "name": "Asciistrator Sync",
  "id": "asciistrator-sync",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma"],
  "menu": [
    { "name": "Import from Asciistrator", "command": "import" },
    { "name": "Export to Asciistrator", "command": "export" }
  ]
}
```

#### 5.4.2 Plugin Code Structure

```typescript
// code.ts
figma.showUI(__html__, { width: 400, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    await importFromAsciistrator(msg.data);
  } else if (msg.type === 'export') {
    const data = await exportToAsciistrator();
    figma.ui.postMessage({ type: 'export-result', data });
  }
};

async function importFromAsciistrator(data: AsciistatorDocument) {
  const page = figma.currentPage;
  
  for (const obj of data.objects) {
    const node = await createFigmaNode(obj);
    if (node) {
      page.appendChild(node);
    }
  }
  
  figma.notify('Import complete!');
}

async function createFigmaNode(obj: AsciistratorObject): Promise<SceneNode | null> {
  switch (obj.type) {
    case 'frame':
      return createFrame(obj);
    case 'rectangle':
      return createRectangle(obj);
    // ... etc
  }
}
```

### Phase 5: Testing & Refinement (Week 5-6)

#### 5.5.1 Test Cases

```javascript
// tests/figma/import.test.js

describe('Figma Import', () => {
  describe('Node Parsing', () => {
    it('should parse FRAME nodes correctly', () => {
      const figmaFrame = {
        type: 'FRAME',
        id: '1:1',
        name: 'Test Frame',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 },
        layoutMode: 'HORIZONTAL',
        itemSpacing: 8,
        paddingTop: 16,
        children: []
      };
      
      const result = parser.parseFrame(figmaFrame);
      
      expect(result.type).toBe('frame');
      expect(result.autoLayout.enabled).toBe(true);
      expect(result.autoLayout.direction).toBe('horizontal');
    });
    
    it('should handle nested structures', () => { /* ... */ });
    it('should preserve constraints', () => { /* ... */ });
    it('should handle components and instances', () => { /* ... */ });
  });
  
  describe('API Integration', () => {
    it('should fetch file data successfully', async () => { /* ... */ });
    it('should handle rate limiting', async () => { /* ... */ });
    it('should handle authentication errors', async () => { /* ... */ });
  });
});
```

---

## 6. API Reference

### 6.1 FigmaAPI Class

```javascript
class FigmaAPI {
  constructor(accessToken: string);
  
  // File operations
  async getFile(fileId: string, options?: GetFileOptions): Promise<FigmaFile>;
  async getFileNodes(fileId: string, nodeIds: string[]): Promise<FigmaNodes>;
  async getFileVersions(fileId: string): Promise<FigmaVersions>;
  
  // Images
  async getImages(fileId: string, nodeIds: string[], format?: 'svg'|'png'|'jpg', scale?: number): Promise<FigmaImages>;
  async getImageFills(fileId: string): Promise<FigmaImageFills>;
  
  // Components
  async getComponents(fileId: string): Promise<FigmaComponents>;
  async getComponentSets(fileId: string): Promise<FigmaComponentSets>;
  
  // Styles
  async getStyles(fileId: string): Promise<FigmaStyles>;
}
```

### 6.2 FigmaImporter Class

```javascript
class FigmaImporter {
  constructor(options?: ImportOptions);
  
  // Import methods
  async importFromAPI(fileId: string, accessToken: string): Promise<ImportResult>;
  async importFromJSON(json: FigmaFile): Promise<ImportResult>;
  
  // Node conversion
  parseNode(node: FigmaNode): AsciistratorObject | null;
  
  // Utility methods
  setScaleFactor(factor: number): void;
  setCharDimensions(width: number, height: number): void;
}
```

### 6.3 FigmaExporter Class

```javascript
class FigmaExporter {
  constructor(options?: ExportOptions);
  
  // Export methods
  exportToJSON(objects: AsciistratorObject[]): FigmaFile;
  exportToSVG(objects: AsciistratorObject[]): string;
  
  // Node conversion  
  exportNode(obj: AsciistratorObject): FigmaNode;
  
  // Utility methods
  setCharDimensions(width: number, height: number): void;
}
```

---

## 7. Limitations & Considerations

### 7.1 Known Limitations

| Feature | Import | Export | Notes |
|---------|--------|--------|-------|
| Vector paths (complex) | ⚠️ Partial | ⚠️ Partial | Bezier curves simplified |
| Boolean operations | ⚠️ Flattened | ❌ Not preserved | Result shape only |
| Masks | ⚠️ Partial | ⚠️ Partial | Clipping approximation |
| Effects (blur, shadow) | ⚠️ Simplified | ⚠️ Simplified | ASCII representation |
| Images | ✅ ASCII dither | ❌ Reference only | Converted to patterns |
| Gradients | ⚠️ Dithered | ⚠️ Simplified | Step-based approximation |
| Text styles | ⚠️ Basic | ⚠️ Basic | Monospace only |
| Variants | ✅ Supported | ✅ Supported | Component variants |
| Prototype links | ❌ Ignored | ❌ Not exported | |
| Comments | ❌ Ignored | ❌ Not exported | |

### 7.2 Security Considerations

1. **API Token Storage**: Never store tokens in code or localStorage
2. **CORS**: API calls must go through a proxy or backend
3. **Rate Limiting**: Figma API has rate limits (30 req/min for free)
4. **Token Scope**: Use minimum required permissions

### 7.3 Performance Considerations

1. **Large Files**: Paginate or limit depth for files with many nodes
2. **Image Downloads**: Batch and cache image requests
3. **Real-time Sync**: Not feasible without plugin (use polling with limits)

### 7.4 Future Enhancements

1. **Real-time Collaboration**: Via Figma plugin WebSocket
2. **Design Tokens**: Import/export design system tokens
3. **Version History**: Track and sync versions
4. **Team Library Sync**: Access shared component libraries
5. **Figma Widgets**: Create ASCII-preview widget

---

## Appendix A: Figma Node Type Reference

```typescript
type FigmaNodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'SECTION';
```

## Appendix B: Color Conversion Utilities

```javascript
// Figma uses 0-1 RGB values
const figmaToHex = ({ r, g, b }) => {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToFigma = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
};
```

## Appendix C: Sample Figma API Response

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
        "backgroundColor": { "r": 0.898, "g": 0.898, "b": 0.898, "a": 1 },
        "children": [
          {
            "id": "1:2",
            "name": "Frame 1",
            "type": "FRAME",
            "absoluteBoundingBox": { "x": 0, "y": 0, "width": 400, "height": 300 },
            "constraints": { "vertical": "TOP", "horizontal": "LEFT" },
            "layoutMode": "VERTICAL",
            "itemSpacing": 16,
            "paddingTop": 24,
            "paddingRight": 24,
            "paddingBottom": 24,
            "paddingLeft": 24,
            "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 1, "b": 1, "a": 1 } }],
            "strokes": [],
            "children": [
              {
                "id": "1:3",
                "name": "Rectangle",
                "type": "RECTANGLE",
                "absoluteBoundingBox": { "x": 24, "y": 24, "width": 352, "height": 100 },
                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 } }],
                "cornerRadius": 8
              }
            ]
          }
        ]
      }
    ]
  },
  "name": "My Design",
  "lastModified": "2024-01-15T10:30:00Z",
  "version": "1234567890"
}
```

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Author: Asciistrator Development Team*
