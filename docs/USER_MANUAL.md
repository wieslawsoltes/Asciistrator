# Asciistrator User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Interface Overview](#interface-overview)
4. [Drawing Tools](#drawing-tools)
5. [Working with Objects](#working-with-objects)
6. [Frames & Containers](#frames--containers)
7. [Layers](#layers)
8. [Charts & Graphs](#charts--graphs)
9. [Flowcharts & Diagrams](#flowcharts--diagrams)
10. [Text & Typography](#text--typography)
11. [Advanced Features](#advanced-features)
12. [File Operations](#file-operations)
13. [Keyboard Shortcuts](#keyboard-shortcuts)
14. [Tips & Tricks](#tips--tricks)

---

## Introduction

**Asciistrator** is a professional-grade vector graphics editor that renders everything in ASCII art. It combines the precision and capabilities of professional vector tools with the unique aesthetic of ASCII characters.

### Key Features

- **Vector Drawing** - Create precise shapes, paths, and curves
- **ASCII Rendering** - All graphics rendered as ASCII/Unicode characters
- **Frames & Containers** - Nestable containers with content clipping
- **Charts & Graphs** - Built-in charting engine with multiple chart types
- **Flowcharts** - Create flowcharts with auto-routing connectors
- **Layers** - Full layer system with blend modes and opacity
- **Command Palette** - Quick access to all commands (Ctrl+K)
- **Version History** - Browse and restore previous states
- **Asset Library** - Save and reuse ASCII art snippets
- **Export** - Export to SVG, PNG, HTML, and plain text
- **Zero Dependencies** - Runs entirely in your browser

---

## Getting Started

### System Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Keyboard and mouse/trackpad
- Minimum 4GB RAM recommended

### Launching Asciistrator

1. Open `index.html` in your web browser
2. The application loads with a default blank document
3. Start creating immediately!

### Creating Your First Document

1. **New Document**: Press `Ctrl+N` (or `⌘N` on Mac)
2. **Set Canvas Size**: Enter width and height in characters
3. **Choose Character Set**: Select from Unicode, ASCII, or Box Drawing
4. **Click Create**: Your canvas is ready!

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📁 File  ✏️ Edit  👁 View  🎨 Object  📊 Charts  🔀 Flow  🪟 Window  ❓ Help │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📄][💾][↩][↪] │ [🔍+][🔍-][🔍100%] │ [⊞][⊡][⊟] │ [▶ Run] │ Theme: [Dark▼] │
├────┬────────────────────────────────────────────────────────────────┬───────┤
│    │                                                                │       │
│ T  │                                                                │ L     │
│ O  │                         CANVAS                                 │ A     │
│ O  │                                                                │ Y     │
│ L  │                                                                │ E     │
│ S  │                                                                │ R     │
│    │                                                                │ S     │
├────┴────────────────────────────────────────────────────────────────┴───────┤
│ Ready │ Objects: 0 │ Layers: 1 │ Zoom: 100% │ Grid: On │ Pos: (0, 0)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Menu Bar

The menu bar provides access to all application functions:

| Menu | Description |
|------|-------------|
| **File** | New, Open, Save, Export, Print |
| **Edit** | Undo, Redo, Cut, Copy, Paste, Select All |
| **View** | Zoom, Grid, Rulers, Guides, Panels |
| **Object** | Transform, Arrange, Group, Align |
| **Charts** | Insert charts, edit data |
| **Flow** | Flowchart tools and shapes |
| **Window** | Panel visibility, workspace |
| **Help** | Documentation, shortcuts, about |

### Toolbar

The vertical toolbar on the left contains all drawing tools:

| Icon | Tool | Shortcut | Description |
|------|------|----------|-------------|
| ↖ | Select | V | Select and move objects |
| ⬚ | Direct Select | A | Edit anchor points |
| ▭ | Rectangle | R | Draw rectangles |
| ○ | Ellipse | O | Draw circles and ellipses |
| ⬚ | Frame | F | Draw frames/containers |
| ⬠ | Polygon | Shift+O | Draw regular polygons |
| ✳ | Star | * | Draw stars |
| ╱ | Line | \\ | Draw straight lines |
| ✒ | Pen | P | Draw bezier paths |
| ✏ | Pencil | N | Freehand drawing |
| T | Text | T | Add text |
| ⊞ | Box | Ctrl+B | Draw ASCII boxes |

### Command Palette (Ctrl+K)

Quick access to all commands:
- Press `Ctrl+K` to open
- Type to search commands
- Use arrow keys to navigate
- Press Enter to execute

### Panels

Right-side panels provide property editing and management:

#### Layers Panel
- View and manage document layers
- Toggle visibility (👁)
- Lock layers (🔒)
- Adjust opacity
- Reorder by dragging

#### Properties Panel
- Edit selected object properties
- Transform (position, size, rotation)
- Style (stroke, fill, characters)
- Text properties (font, size, alignment)

#### Color Panel
- Character palette for ASCII art
- Recent characters
- Custom character sets

#### History Panel
- View undo/redo history
- Click to jump to any state
- Clear history

#### Version History (Window > Version History)
- Browse all saved states
- Preview previous versions
- Restore any state

#### Asset Library (Window > Asset Library)
- Save reusable ASCII art snippets
- Organize with categories
- Quick insert into documents

### Status Bar

The status bar shows:
- Current tool name
- Selection count
- Layer count
- Zoom level
- Grid status
- Cursor position

---

## Drawing Tools

### Selection Tools

#### Select Tool (V)
The primary tool for selecting and moving objects.

**Usage:**
- Click an object to select it
- Shift+Click to add to selection
- Click and drag to move
- Drag handles to resize
- Drag rotation handle to rotate

#### Direct Select Tool (A)
Edit individual anchor points and paths.

**Usage:**
- Click anchor point to select
- Drag to move anchor
- Drag handles to adjust curves
- Alt+Click to convert anchor type

#### Lasso Tool (Q)
Free-form selection by drawing around objects.

#### Marquee Tool (M)
Rectangular or elliptical selection area.

### Shape Tools

#### Rectangle Tool (R)
Draw rectangles and squares.

**Modifiers:**
- Hold Shift: Constrain to square
- Hold Alt: Draw from center
- Hold Shift+Alt: Square from center

**Options:**
- Corner radius for rounded rectangles
- Border style (single, double, heavy, rounded)

#### Ellipse Tool (O)
Draw ellipses and circles.

**Modifiers:**
- Hold Shift: Constrain to circle
- Hold Alt: Draw from center

#### Polygon Tool (Shift+O)
Draw regular polygons with 3-100 sides.

**Options:**
- Number of sides
- Star ratio (for star shapes)

#### Star Tool (*)
Draw multi-pointed stars.

**Options:**
- Number of points (3-100)
- Inner radius ratio

#### Line Tool (\\)
Draw straight lines.

**Modifiers:**
- Hold Shift: Constrain to 45° angles

**Options:**
- Line style (solid, dashed, dotted)
- Arrow heads (start, end, both)

### Path Tools

#### Pen Tool (P)
Create precise bezier curves.

**Usage:**
1. Click to create corner anchor
2. Click and drag to create smooth anchor
3. Continue clicking to extend path
4. Click first anchor or press Enter to close
5. Press Escape to leave open

**Modifiers:**
- Hold Alt: Convert anchor to corner
- Hold Shift: Constrain angles

#### Pencil Tool (N)
Freehand drawing that smooths into paths.

**Options:**
- Smoothness (0-100%)
- Fidelity (fewer or more points)

### Text Tools

#### Text Tool (T)
Add point text or area text.

**Point Text:**
- Click once and type
- Text flows in one line

**Area Text:**
- Click and drag to create text area
- Text wraps within bounds

**Options:**
- Font size
- Alignment (left, center, right)
- Character spacing

#### ASCII Art Text (Ctrl+T)
Create FIGlet-style ASCII art text.

**Fonts Available:**
- Standard
- Block
- Banner
- Slant
- Small
- Big

### Special ASCII Tools

#### Box Draw Tool (Ctrl+B)
Draw boxes with Unicode box-drawing characters.

**Border Styles:**
- Single line (─│┌┐└┘)
- Double line (═║╔╗╚╝)
- Heavy line (━┃┏┓┗┛)
- Rounded (─│╭╮╰╯)
- Mixed styles

#### Table Tool (Ctrl+Shift+T)
Create ASCII tables.

**Features:**
- Specify rows and columns
- Auto-size columns
- Multiple border styles
- Cell alignment

#### Pattern Fill Tool (Ctrl+F)
Fill areas with ASCII patterns.

**Patterns:**
- Density gradients (░▒▓█)
- Dot patterns (·•●)
- Custom patterns

---

## Working with Objects

### Selecting Objects

| Action | Method |
|--------|--------|
| Select one | Click with Select tool |
| Add to selection | Shift+Click |
| Select all | Ctrl+A |
| Deselect all | Ctrl+Shift+A or Escape |
| Select by type | Select > By Type |

### Transforming Objects

#### Move
- Drag with Select tool
- Use arrow keys (1 unit)
- Shift+Arrow keys (10 units)
- Enter exact position in Properties panel

#### Scale
- Drag corner handles
- Hold Shift to maintain aspect ratio
- Hold Alt to scale from center
- Enter exact size in Properties panel

#### Rotate
- Drag rotation handle (outside corner)
- Hold Shift for 15° increments
- Enter exact angle in Properties panel

#### Reflect/Flip
- Object > Transform > Flip Horizontal
- Object > Transform > Flip Vertical

### Arranging Objects

#### Z-Order
| Action | Shortcut |
|--------|----------|
| Bring to Front | Ctrl+Shift+] |
| Bring Forward | Ctrl+] |
| Send Backward | Ctrl+[ |
| Send to Back | Ctrl+Shift+[ |

#### Alignment
Select multiple objects, then:
- Object > Align > Left/Center/Right
- Object > Align > Top/Middle/Bottom

#### Distribution
Select 3+ objects, then:
- Object > Distribute > Horizontally
- Object > Distribute > Vertically

### Grouping

| Action | Shortcut |
|--------|----------|
| Group | Ctrl+G |
| Ungroup | Ctrl+Shift+G |

Groups can be:
- Moved and transformed as one
- Nested (groups within groups)
- Double-clicked to enter isolation mode

### Boolean Operations

Combine shapes using:
- **Union**: Merge shapes together
- **Subtract**: Cut one shape from another
- **Intersect**: Keep only overlapping area
- **Exclude**: Remove overlapping area

Access via Object > Path menu or Command Palette (Ctrl+K).

---

## Frames & Containers

### What are Frames?

Frames are nestable containers that can hold other objects and optionally clip their content to the frame bounds. They're similar to frames in Figma.

### Creating Frames

**Method 1: Frame Tool (F)**
1. Press `F` to select the Frame tool
2. Click and drag to draw a frame
3. Release to create

**Method 2: Frame Selection (Ctrl+Alt+G)**
1. Select one or more objects
2. Press `Ctrl+Alt+G` or use Command Palette
3. A frame is created around the selection

### Frame Example

```
╭─ My Frame ──────────────────╮
│                             │
│    ┌────────────┐          │
│    │ Child Obj  │          │
│    └────────────┘          │
│                             │
│           ○                 │
│          ╱ ╲               │
│                             │
╰─────────────────────────────╯
```

### Frame Properties

| Property | Description |
|----------|-------------|
| **Title** | Optional text shown on frame border |
| **Border Style** | single, double, rounded, dashed, thick |
| **Clip Content** | Hide children outside frame bounds |
| **Auto Size** | Automatically resize to fit content |
| **Background** | Fill character and color |
| **Padding** | Space inside frame edges |
| **Auto Layout** | Automatic child positioning (Figma-style) |

### Border Styles

```
Single:          Double:          Rounded:
┌────────┐       ╔════════╗       ╭────────╮
│        │       ║        ║       │        │
└────────┘       ╚════════╝       ╰────────╯

Dashed:          Thick:
┌┄┄┄┄┄┄┄┄┐       ┏━━━━━━━━┓
┆        ┆       ┃        ┃
└┄┄┄┄┄┄┄┄┘       ┗━━━━━━━━┛
```

### Auto Layout (Figma-style)

Auto Layout automatically arranges child objects within a frame.

**Enable Auto Layout:**
1. Select a frame
2. Press `Shift+A` or go to Object > Frame / Auto Layout > Toggle Auto Layout
3. Open Frame Properties to configure settings

**Auto Layout Options:**

| Setting | Options | Description |
|---------|---------|-------------|
| **Direction** | Horizontal, Vertical | Stack direction |
| **Spacing** | 0-n | Gap between items |
| **Alignment** | Start, Center, End, Stretch | Cross-axis alignment |
| **Distribution** | Packed, Space Between, Space Around, Space Evenly | Main-axis distribution |
| **Wrap** | On/Off | Wrap items to next row/column |
| **Reversed** | On/Off | Reverse item order |

**Frame Sizing:**
- **Fixed**: Frame keeps manual size
- **Hug Contents**: Frame shrinks to fit children

**Child Sizing:**
- **Fixed**: Child keeps its own size
- **Fill**: Child expands to fill available space

**Example - Horizontal Layout:**
```
┌─ Toolbar ─────────────────────────┐
│ [Save] [Open] [Export] [Settings] │
└───────────────────────────────────┘
```

**Example - Vertical Layout with Spacing:**
```
┌─ Menu ────┐
│ Home      │
│           │
│ Products  │
│           │
│ Contact   │
└───────────┘
```

### Working with Frames

**Add Objects to Frame:**
1. Select frame and objects
2. Use "Add to Frame" command
3. Objects become frame children

**Remove from Frame:**
1. Select child object
2. Use "Remove from Frame" command
3. Object is moved to parent layer

**Move Frame:**
- Dragging a frame moves all children together
- Children maintain relative positions

**Clip Content:**
- When enabled, children are clipped to frame bounds
- Great for creating viewports or masked areas

### Frame Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Frame Tool | F | Activate frame drawing |
| Frame Selection | Ctrl+Alt+G | Create frame from selection |
| Add to Frame | - | Add objects to selected frame |
| Remove from Frame | - | Remove objects from frame |
| Toggle Auto Layout | Shift+A | Enable/disable auto layout |
| Apply Auto Layout | - | Recalculate child positions |
| Set Child Sizing | - | Configure how children resize |
| Frame Properties | - | Edit frame settings |

---

## Layers

### Layer Panel Overview

```
┌─────────────────────────────────────┐
│ LAYERS                          [+] │
├─────────────────────────────────────┤
│ ☐ 🔒 👁 Layer 3 - Text         100% │
│ ☑    👁 Layer 2 - Shapes        80% │
│ ☐    👁 Layer 1 - Background   100% │
├─────────────────────────────────────┤
│ [+] [-] [⇧] [⇩] [📁]               │
└─────────────────────────────────────┘
```

### Layer Operations

| Action | Method |
|--------|--------|
| New Layer | Click [+] or Ctrl+Shift+N |
| Delete Layer | Click [-] |
| Move Up | Click [⇧] |
| Move Down | Click [⇩] |
| Create Group | Click [📁] |
| Rename | Double-click layer name |
| Toggle Visibility | Click 👁 icon |
| Toggle Lock | Click 🔒 icon |

### Layer Properties

- **Opacity**: 0-100% transparency
- **Blend Mode**: How layer combines with layers below
- **Lock**: Prevent editing
- **Visibility**: Show/hide layer

### Working with Layers

**Moving Objects Between Layers:**
1. Select object(s)
2. Cut (Ctrl+X)
3. Select target layer
4. Paste (Ctrl+V)

Or drag objects in Layers panel.

**Layer Groups:**
- Create folders to organize layers
- Collapse/expand groups
- Apply effects to entire group

---

## Charts & Graphs

### Creating Charts

1. Select Insert > Chart or click chart icon in toolbar
2. Choose chart type
3. Enter or import data
4. Customize appearance
5. Click Insert

### Chart Types

#### Bar Chart
```
Revenue by Quarter

Q1 ████████████████████ 85%
Q2 ██████████████ 62%
Q3 ████████████████████████ 95%
Q4 ███████████████████ 78%
   └──────────────────────
    0%  25%  50%  75% 100%
```

#### Line Chart
```
Stock Price

100│      ╭──╮
 80│   ╭──╯  ╰──╮
 60│╭──╯        ╰──╮
 40││              ╰──
 20│
   └───────────────────
     J  F  M  A  M  J
```

#### Pie Chart
```
Market Share

      ╭────────╮
   ╭──┤ 35%    │
  ╱   │ Chrome ├──╮
 │    ╰────────╯  │25%
 │    ╭────────╮  │Firefox
  ╲   │ 25%    ├──╯
   ╰──┤ Safari │
      ╰────────╯
```

#### Scatter Plot
```
Correlation

│    ·  ·
│  ·  · ·  ·
│ · · ·· · ·
│· ·· · ·  ·
│·· · ·   ·
│· ·  ·
└─────────────
```

### Chart Data

**Manual Entry:**
- Edit data in chart properties panel
- Add/remove rows and columns
- Edit labels and values

**Import Data:**
- Import from CSV file
- Paste from spreadsheet
- Import JSON data

### Chart Customization

- **Title**: Add and position chart title
- **Legend**: Show/hide, position
- **Axes**: Labels, grid lines, scale
- **Colors**: Character sets for different series
- **Animation**: Animate chart rendering

---

## Flowcharts & Diagrams

### Flowchart Shapes

```
┌──────────┐    ╭──────────╮    ╔══════════╗
│ Process  │    │ Terminal │    ║   I/O    ║
└──────────┘    ╰──────────╯    ╚══════════╝
 Rectangle       Rounded         Parallelogram

    ◇            ┌──────────────┐      ◯
   ╱ ╲           │  ┌───────┐  │     ╱ ╲
  ◇   ◇          │  │       │  │    │   │
   ╲ ╱           │  └───────┘  │     ╲ ╱
    ◇            └──────────────┘      ◯
 Decision         Subprocess       Connector
```

### Creating Flowcharts

1. Select flowchart shape from toolbar
2. Click on canvas to place
3. Double-click to edit text
4. Use Connection Tool to link shapes

### Connectors

**Types:**
- Straight arrows (────────▶)
- Orthogonal (────┬───▶)
- Curved (~~~~~▶)
- Dashed (─ ─ ─ ─▶)

**Features:**
- Auto-routing around shapes
- Snap to connection points
- Add labels to connectors
- Multiple arrow styles

### Auto-Layout

Automatically arrange flowchart:
1. Select all shapes
2. Flow > Auto Layout
3. Choose direction (top-down, left-right)
4. Adjust spacing

### Diagram Templates

Pre-built templates:
- Basic Flowchart
- Swimlane Diagram
- Sequence Diagram
- State Machine
- Org Chart
- Mind Map

---

## Text & Typography

### Text Types

#### Point Text
Single line of text that doesn't wrap.
- Click with Text tool
- Type your text
- Press Escape when done

#### Area Text
Text within a bounding box that wraps.
- Drag with Text tool to create area
- Type your text
- Text wraps at boundaries

#### Text on Path
Text that follows a curve.
1. Draw a path
2. Select Text on Path tool
3. Click on the path
4. Type your text

### ASCII Art Text

Create large decorative text using ASCII art fonts:

**Standard Font:**
```
 _   _      _ _       
| | | | ___| | | ___  
| |_| |/ _ \ | |/ _ \ 
|  _  |  __/ | | (_) |
|_| |_|\___|_|_|\___/ 
```

**Block Font:**
```
█   █ █▀▀▀ █    █    █▀▀█
█▀▀▀█ █▀▀  █    █    █  █
█   █ █▄▄▄ █▄▄▄ █▄▄▄ █▄▄█
```

**Banner Font:**
```
#  #  ####  #     #      ###
#  #  #     #     #     #   #
####  ###   #     #     #   #
#  #  #     #     #     #   #
#  #  ####  ####  ####   ###
```

### Text Properties

| Property | Description |
|----------|-------------|
| Size | Character height in grid units |
| Alignment | Left, Center, Right |
| Line Height | Space between lines |
| Character Spacing | Space between characters |
| Fill Character | Character used for text |

---

## Advanced Features

### Command Palette (Ctrl+K)

The Command Palette provides quick access to all application commands:

1. Press `Ctrl+K` to open
2. Start typing to search
3. Use arrow keys to navigate results
4. Press Enter to execute command
5. Press Escape to close

**Features:**
- Search by command name
- Grouped by category
- Shows keyboard shortcuts
- Quick access to tools, actions, and settings

### Version History

Browse and restore previous document states:

1. Open via Window > Version History
2. View chronological list of changes
3. Preview any previous state
4. Click "Restore" to revert

### Asset Library

Save and reuse ASCII art snippets:

1. Open via Window > Asset Library
2. Select objects and click "Save as Asset"
3. Name and categorize your asset
4. Insert assets into any document

**Default Assets Include:**
- Common borders and frames
- UI elements
- Decorative elements
- Icons and symbols

### Multi-Select Editing

Edit properties of multiple objects at once:

1. Select multiple objects (Shift+Click or drag selection)
2. Open via Edit > Edit Multiple Objects
3. Change shared properties
4. Apply to all selected objects

**Editable Properties:**
- Stroke character and color
- Fill character and color
- Line style
- Visibility and lock state

### Selection Filters

Filter and select objects by criteria:

1. Open via Select > Selection Filters
2. Choose filter type:
   - By object type (rectangle, text, etc.)
   - By status (locked, hidden, visible)
3. Apply to select matching objects

### Constraints

Pin objects to canvas edges:

1. Select an object
2. Open Object > Constraints
3. Enable edge pins (left, right, top, bottom)
4. Enable centering (horizontal, vertical)
5. Object repositions when canvas resizes

### Saved Styles

Save and reuse style combinations:

1. Open Object > Saved Styles
2. Create style with current properties
3. Apply saved styles to objects
4. Edit or delete saved styles

### Copy/Paste Properties

Copy style from one object to another:

| Action | Shortcut |
|--------|----------|
| Copy Properties | Ctrl+Alt+C |
| Paste Properties | Ctrl+Alt+V |

### Batch Rename

Rename multiple objects with patterns:

1. Select objects to rename
2. Open Object > Batch Rename
3. Enter pattern (e.g., "Item {n}")
4. Preview and apply

### Measure Tool (M)

Show distances between objects:

1. Press `M` to activate
2. Click and drag to measure
3. See distance in status bar
4. Click again to exit

### Outline View

View only object outlines:

1. Toggle via View > Outline View
2. Useful for complex documents
3. Easier selection and editing

### Dev Mode Panel

Focused code export view:

1. Open via Window > Dev Mode
2. See generated ASCII code
3. Copy formatted output
4. Choose export format

---

## File Operations

### Creating Documents

**New Document (Ctrl+N):**
- Set width and height (in characters)
- Choose background color
- Select default character set

### Opening Files

**Open (Ctrl+O):**
- Native .ascii format
- SVG files
- Plain text files

### Saving Files

**Save (Ctrl+S):**
- Saves in native .ascii format
- Preserves all layers and properties
- Includes undo history

**Save As (Ctrl+Shift+S):**
- Save with new name
- Choose location

### Exporting

**Export (Ctrl+E):**

| Format | Extension | Description |
|--------|-----------|-------------|
| Plain Text | .txt | Raw ASCII output |
| HTML | .html | Styled with CSS |
| SVG | .svg | Vector graphics |
| PNG | .png | Raster image |
| ANSI | .ans | ANSI colored text |
| Markdown | .md | Code blocks |

### Import Options

**Import Image:**
- Convert raster images to ASCII
- Adjust threshold and contrast
- Choose character density palette

**Import SVG:**
- Import vector graphics
- Convert to ASCII paths

**Import CSV:**
- Import data for charts
- Map columns to data series

---

## Keyboard Shortcuts

### File Operations
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New | Ctrl+N | ⌘N |
| Open | Ctrl+O | ⌘O |
| Save | Ctrl+S | ⌘S |
| Save As | Ctrl+Shift+S | ⌘⇧S |
| Export | Ctrl+E | ⌘E |
| Print | Ctrl+P | ⌘P |

### Edit Operations
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Undo | Ctrl+Z | ⌘Z |
| Redo | Ctrl+Shift+Z | ⌘⇧Z |
| Cut | Ctrl+X | ⌘X |
| Copy | Ctrl+C | ⌘C |
| Paste | Ctrl+V | ⌘V |
| Duplicate | Ctrl+D | ⌘D |
| Delete | Delete | Delete |
| Select All | Ctrl+A | ⌘A |
| Deselect | Ctrl+Shift+A | ⌘⇧A |

### View Operations
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Zoom In | Ctrl++ | ⌘+ |
| Zoom Out | Ctrl+- | ⌘- |
| Fit to Window | Ctrl+0 | ⌘0 |
| Actual Size | Ctrl+1 | ⌘1 |
| Toggle Grid | Ctrl+' | ⌘' |
| Toggle Rulers | Ctrl+R | ⌘R |
| Pan | Space+Drag | Space+Drag |

### Tool Shortcuts
| Tool | Shortcut |
|------|----------|
| Select | V |
| Direct Select | A |
| Rectangle | R |
| Ellipse | O |
| Frame | F |
| Line | L or \\ |
| Pen | P |
| Pencil | N |
| Brush | B |
| Text | T |
| Eraser | E |
| Measure | M |

### Object Operations
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Group | Ctrl+G | ⌘G |
| Ungroup | Ctrl+Shift+G | ⌘⇧G |
| Frame Selection | Ctrl+Alt+G | ⌘⌥G |
| Rename | Ctrl+R | ⌘R |
| Copy Properties | Ctrl+Alt+C | ⌘⌥C |
| Paste Properties | Ctrl+Alt+V | ⌘⌥V |
| Bring to Front | Ctrl+Shift+] | ⌘⇧] |
| Send to Back | Ctrl+Shift+[ | ⌘⇧[ |
| Lock | Ctrl+2 | ⌘2 |
| Unlock All | Ctrl+Alt+2 | ⌘⌥2 |
| Hide | Ctrl+3 | ⌘3 |
| Show All | Ctrl+Alt+3 | ⌘⌥3 |

### Quick Actions
| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Command Palette | Ctrl+K | ⌘K |
| Find and Replace | Ctrl+H | ⌘H |
| Quick Rename | F2 | F2 |
| Swap Colors | X | X |

---

## Tips & Tricks

### Performance Tips

1. **Large Documents**: Use layers to organize and hide complex objects
2. **Many Objects**: Group objects that don't need individual editing
3. **Smooth Scrolling**: Reduce zoom level for smoother panning
4. **Memory**: Clear history periodically for long sessions

### Design Tips

1. **Grid**: Use grid snap for precise alignment
2. **Guides**: Create guides for consistent layouts
3. **Templates**: Save commonly used designs as templates
4. **Symbols**: Convert repeated elements to symbols

### ASCII Art Tips

1. **Character Choice**: Use appropriate density characters for shading
2. **Box Drawing**: Use Unicode box characters for clean lines
3. **Aspect Ratio**: ASCII characters are taller than wide
4. **Preview**: Toggle between edit and preview modes

### Keyboard Efficiency

1. **Tool Switching**: Use single-key shortcuts (V, R, O, P)
2. **Temporary Tools**: Hold key for temporary tool switch
3. **Numeric Input**: Enter exact values while transforming
4. **Tab**: Cycle through input fields in Properties panel

---

## Troubleshooting

### Common Issues

**Objects not selecting:**
- Check if layer is locked
- Check if object is on hidden layer
- Try using Select All

**Canvas not rendering:**
- Refresh the browser
- Clear browser cache
- Check console for errors

**Export not working:**
- Check file permissions
- Try different export format
- Reduce document complexity

### Getting Help

- **Built-in Help**: Help > Documentation
- **Keyboard Shortcuts**: Help > Keyboard Shortcuts
- **About**: Help > About Asciistrator

---

## Appendix: Character Reference

### Box Drawing
```
Single:  ─│┌┐└┘├┤┬┴┼
Double:  ═║╔╗╚╝╠╣╦╩╬
Heavy:   ━┃┏┓┗┛┣┫┳┻╋
Rounded: ╭╮╰╯
```

### Block Elements
```
█▓▒░ ▀▄▌▐ ▖▗▘▝
```

### Arrows
```
←↑→↓ ↔↕ ↖↗↘↙
⇐⇑⇒⇓ ⇔⇕
◀▲▶▼ ◁△▷▽
```

### Shapes
```
●○◐◑ ■□▪▫ ◆◇ ★☆
```

---

*Asciistrator - Where Vectors Meet ASCII*

Version 1.0.0 | © 2024
