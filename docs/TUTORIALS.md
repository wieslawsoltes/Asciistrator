# Asciistrator Tutorials

## Table of Contents

1. [Getting Started](#tutorial-1-getting-started)
2. [Drawing Basic Shapes](#tutorial-2-drawing-basic-shapes)
3. [Creating ASCII Art Text](#tutorial-3-creating-ascii-art-text)
4. [Building a Flowchart](#tutorial-4-building-a-flowchart)
5. [Creating Charts](#tutorial-5-creating-charts)
6. [Working with Layers](#tutorial-6-working-with-layers)
7. [Advanced Path Editing](#tutorial-7-advanced-path-editing)
8. [Creating ASCII Art from Images](#tutorial-8-creating-ascii-art-from-images)

---

## Tutorial 1: Getting Started

### Overview
In this tutorial, you'll learn the basics of Asciistrator's interface and create your first ASCII drawing.

### Duration: 10 minutes

### Steps

#### Step 1: Create a New Document
1. Open Asciistrator in your browser
2. Press `Ctrl+N` or go to File > New
3. Set the canvas size:
   - Width: 80 characters
   - Height: 40 characters
4. Click "Create"

#### Step 2: Explore the Interface
Take a moment to identify these key areas:

```
┌─────────────────────────────────────────────┐
│ Menu Bar - File, Edit, View, etc.           │
├─────┬───────────────────────────────┬───────┤
│     │                               │       │
│ T   │         Canvas Area           │ Panels│
│ o   │   (Your ASCII art appears     │       │
│ o   │          here)                │       │
│ l   │                               │       │
│ s   │                               │       │
├─────┴───────────────────────────────┴───────┤
│ Status Bar - Tool info, zoom, position      │
└─────────────────────────────────────────────┘
```

#### Step 3: Select the Rectangle Tool
1. Look at the toolbar on the left
2. Click the Rectangle icon (▭) or press `R`
3. Notice the status bar shows "Rectangle Tool"

#### Step 4: Draw Your First Shape
1. Click and drag on the canvas
2. Release to complete the rectangle
3. You should see something like:

```
┌──────────────────┐
│                  │
│                  │
│                  │
└──────────────────┘
```

#### Step 5: Move the Shape
1. Press `V` to switch to the Select tool
2. Click on your rectangle to select it
3. Drag it to a new position

#### Step 6: Save Your Work
1. Press `Ctrl+S` or go to File > Save
2. Name your file "my-first-drawing.ascii"
3. Click Save

### Congratulations!
You've created your first ASCII drawing. Continue to the next tutorial to learn more about shapes.

---

## Tutorial 2: Drawing Basic Shapes

### Overview
Learn to create and customize various shapes in Asciistrator.

### Duration: 15 minutes

### Steps

#### Step 1: Create Multiple Rectangles
1. Select Rectangle tool (`R`)
2. Draw three rectangles of different sizes
3. Try holding `Shift` while dragging to create a square

#### Step 2: Change Border Styles
1. Select a rectangle
2. In the Properties panel, find "Border Style"
3. Try different styles:

```
Single:          Double:          Rounded:
┌────────┐       ╔════════╗       ╭────────╮
│        │       ║        ║       │        │
└────────┘       ╚════════╝       ╰────────╯
```

#### Step 3: Draw Ellipses
1. Select Ellipse tool (`O`)
2. Click and drag to draw an ellipse
3. Hold `Shift` for a perfect circle

```
    ╭────────────╮
   ╱              ╲
  │                │
   ╲              ╱
    ╰────────────╯
```

#### Step 4: Create a Polygon
1. Select Polygon tool (`Shift+O`)
2. In Properties panel, set Sides to 6
3. Draw a hexagon:

```
      ╱╲
     ╱  ╲
    │    │
     ╲  ╱
      ╲╱
```

#### Step 5: Draw a Star
1. Select Star tool (`*`)
2. Set Points to 5 in Properties
3. Draw a star:

```
      ★
     ╱╲
    ╱──╲
   ╱    ╲
```

#### Step 6: Create Lines
1. Select Line tool (`\`)
2. Draw some lines
3. Hold `Shift` for 45° angle constraints

#### Step 7: Arrange Your Shapes
1. Select multiple shapes (Shift+Click)
2. Use Object > Align > Center Horizontally
3. Experiment with other alignment options

### Exercise
Create this simple house using the shapes you've learned:

```
        ╱╲
       ╱  ╲
      ╱────╲
     ┌──────┐
     │  ──  │
     │ │  │ │
     └──────┘
```

---

## Tutorial 3: Creating ASCII Art Text

### Overview
Create eye-catching text using ASCII art fonts.

### Duration: 10 minutes

### Steps

#### Step 1: Add Regular Text
1. Select Text tool (`T`)
2. Click on the canvas
3. Type "Hello"
4. Press `Escape` to finish

#### Step 2: Create ASCII Art Text
1. Select the ASCII Art Text tool (`Ctrl+T`)
2. Click on the canvas
3. Type "HELLO"
4. Choose a font from the Properties panel

#### Step 3: Explore Different Fonts

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

#### Step 4: Create a Title
1. Create ASCII art text saying "WELCOME"
2. Add a regular text subtitle underneath
3. Draw a box around both:

```
╔═════════════════════════════════════╗
║                                     ║
║  █   █ █▀▀▀ █    █▀▀▀ █▀▀█ █▀▄▀█ █▀▀▀║
║  █ █ █ █▀▀  █    █    █  █ █ █ █ █▀▀ ║
║  █▀ ▀█ █▄▄▄ █▄▄▄ █▄▄▄ █▄▄█ █   █ █▄▄▄║
║                                     ║
║       To Asciistrator v1.0          ║
║                                     ║
╚═════════════════════════════════════╝
```

### Exercise
Create a movie poster style text with a title and tagline.

---

## Tutorial 4: Building a Flowchart

### Overview
Create a professional flowchart with shapes and connectors.

### Duration: 20 minutes

### Steps

#### Step 1: Plan Your Flowchart
We'll create a simple login process flowchart:
1. Start
2. Enter credentials
3. Validate
4. Success or failure
5. End

#### Step 2: Add Terminal Shapes
1. Go to Flow menu or select Terminal shape tool
2. Draw two rounded rectangles for Start and End:

```
╭───────────╮          ╭───────────╮
│   Start   │          │    End    │
╰───────────╯          ╰───────────╯
```

#### Step 3: Add Process Shapes
1. Select Process shape (rectangle)
2. Add "Enter Credentials" and "Show Dashboard":

```
┌─────────────────┐    ┌─────────────────┐
│    Enter        │    │     Show        │
│  Credentials    │    │   Dashboard     │
└─────────────────┘    └─────────────────┘
```

#### Step 4: Add Decision Shape
1. Select Decision shape (diamond)
2. Add "Valid?" decision:

```
       ◇
      ╱ ╲
     ╱   ╲
    ◇Valid?◇
     ╲   ╱
      ╲ ╱
       ◇
```

#### Step 5: Connect the Shapes
1. Select the Connection tool
2. Click the bottom of "Start"
3. Click the top of "Enter Credentials"
4. Continue connecting all shapes

#### Step 6: Add Labels to Connectors
1. Select a connector
2. In Properties, add label "Yes" or "No"

#### Step 7: Complete Flowchart
Your flowchart should look like this:

```
                 ╭───────────╮
                 │   Start   │
                 ╰─────┬─────╯
                       │
                       ▼
              ┌────────────────┐
              │     Enter      │
              │  Credentials   │
              └───────┬────────┘
                      │
                      ▼
                  ◇───────◇
                 ╱ Valid?  ╲
                ◇───────────◇
               ╱             ╲
           Yes               No
            │                 │
            ▼                 │
   ┌────────────────┐         │
   │     Show       │         │
   │   Dashboard    │         │
   └───────┬────────┘         │
           │                  │
           ▼                  │
    ╭───────────╮             │
    │    End    │◀────────────┘
    ╰───────────╯
```

#### Step 8: Use Auto-Layout (Optional)
1. Select all shapes (`Ctrl+A`)
2. Go to Flow > Auto Layout
3. Choose "Top to Bottom"

### Exercise
Create a flowchart for making a cup of coffee.

---

## Tutorial 5: Creating Charts

### Overview
Visualize data with ASCII charts.

### Duration: 15 minutes

### Steps

#### Step 1: Insert a Bar Chart
1. Go to Insert > Chart > Bar Chart
2. A dialog will open for data entry

#### Step 2: Enter Your Data
Enter this sample data:
| Label | Value |
|-------|-------|
| Jan   | 65    |
| Feb   | 45    |
| Mar   | 78    |
| Apr   | 82    |
| May   | 91    |

#### Step 3: Customize the Chart
1. Set Title: "Monthly Sales"
2. Enable Legend
3. Set Y-axis label: "Units"

Result:
```
Monthly Sales

Jan ████████████████████████████████ 65
Feb ██████████████████████ 45
Mar ██████████████████████████████████████ 78
Apr ████████████████████████████████████████ 82
May ████████████████████████████████████████████ 91
    └──────────────────────────────────────────┘
     0    20    40    60    80   100

    █ Sales (Units)
```

#### Step 4: Create a Line Chart
1. Insert > Chart > Line Chart
2. Enter time-series data:

```
Stock Price

100│            ╭─╮
 80│      ╭────╯  ╰──╮
 60│  ╭──╯           ╰──╮
 40│──╯                 ╰──
 20│
   └───────────────────────
     J  F  M  A  M  J  J
```

#### Step 5: Create a Pie Chart
1. Insert > Chart > Pie Chart
2. Enter category data:

```
Market Share

      ╭────────────╮
   ╭──┤   Chrome   ├──╮
  ╱   │    45%     │   ╲
 │    ╰────────────╯    │
 │  ╭────────╮  ╭────────╮
  ╲ │Firefox │  │ Safari │
   ╲│  25%   │  │  20%   │
    ╰────────╯  ╰────────╯
        │  Other 10%  │
        └─────────────┘
```

#### Step 6: Edit Chart Data
1. Select your chart
2. Click "Edit Data" in Properties panel
3. Modify values and see live updates

### Exercise
Create a chart showing your weekly schedule or any data of your choice.

---

## Tutorial 6: Working with Layers

### Overview
Organize complex drawings using layers.

### Duration: 15 minutes

### Steps

#### Step 1: Understanding Layers
Think of layers like transparent sheets stacked on top of each other:
- Objects on higher layers appear in front
- You can hide, lock, and adjust opacity of each layer

#### Step 2: Create a New Layer
1. In the Layers panel, click the "+" button
2. Name it "Background"
3. Create another layer called "Foreground"

#### Step 3: Draw on Different Layers
1. Select "Background" layer
2. Draw a large rectangle as background:
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

3. Select "Foreground" layer
4. Draw shapes on top:
```
┌────────────────┐
│  Hello World   │
└────────────────┘
```

#### Step 4: Layer Operations
Try these operations:
1. **Hide a layer**: Click the 👁 icon
2. **Lock a layer**: Click the 🔒 icon
3. **Change opacity**: Drag the opacity slider
4. **Reorder**: Drag layers up/down

#### Step 5: Create a Layered Scene
Create a simple scene with multiple layers:

**Layer 3 - Text:**
```
        ★ NIGHT SCENE ★
```

**Layer 2 - Objects:**
```
      ╱╲
     ╱  ╲
    ╱────╲
   ┌──────┐
   │ │  │ │
   └──────┘
```

**Layer 1 - Background:**
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░░░░░·░░░░░░░·░░░░░░░░·░░░░░░░░░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

**Combined result:**
```
░░░░░░░░★ NIGHT SCENE ★░░░░░░░░░
░░░░░·░░░░░░░·░░░╱╲░·░░░░░░░░░░░
░░░░░░░░░░░░░░░░╱  ╲░░░░░░░░░░░░
▓▓▓▓▓▓▓▓▓▓▓▓▓▓╱────╲▓▓▓▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓┌──────┐▓▓▓▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓│ │  │ │▓▓▓▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓└──────┘▓▓▓▓▓▓▓▓▓▓▓▓
```

### Exercise
Create a layered business card design with background, border, and text layers.

---

## Tutorial 7: Advanced Path Editing

### Overview
Master the Pen tool and path editing.

### Duration: 20 minutes

### Steps

#### Step 1: Understanding Bezier Curves
Bezier curves are defined by anchor points and control handles:
- **Anchor points**: Where the curve passes through
- **Control handles**: Define the curve direction and strength

#### Step 2: Draw with the Pen Tool
1. Select Pen tool (`P`)
2. Click to create corner points
3. Click and drag to create smooth curves

#### Step 3: Create a Simple Curve
1. Click at position A (start point)
2. Click and drag at position B (creates curve)
3. Click at position C (end point)

```
    A
     ╲
      ╲
       ╲
        B
       ╱
      ╱
     ╱
    C
```

#### Step 4: Edit Anchor Points
1. Select Direct Select tool (`A`)
2. Click on an anchor point
3. Drag to move it
4. Drag control handles to adjust curves

#### Step 5: Convert Point Types
- **Corner point**: Sharp angle
- **Smooth point**: Continuous curve
- **Symmetric point**: Equal handles

Hold `Alt` and click to convert between types.

#### Step 6: Create a Wave Pattern
1. Start with Pen tool
2. Create alternating curves:

```
     ╭───╮     ╭───╮     ╭───╮
────╯    ╰────╯    ╰────╯    ╰────
```

#### Step 7: Create a Custom Shape
Draw a speech bubble:

```
    ╭─────────────────────╮
   │                       │
   │   Hello, World!       │
   │                       │
    ╰───────────┬─────────╯
                │
               ╱
              ╱
```

Steps:
1. Draw rounded rectangle path
2. Add extra points for the tail
3. Adjust curves for smooth transitions

### Exercise
Create a custom logo using paths and curves.

---

## Tutorial 8: Creating ASCII Art from Images

### Overview
Convert raster images to ASCII art.

### Duration: 15 minutes

### Steps

#### Step 1: Prepare Your Image
- Use high contrast images for best results
- Simple subjects work better than complex scenes
- Black and white or grayscale images convert better

#### Step 2: Import an Image
1. Go to File > Import > Image
2. Select an image file (PNG, JPG)
3. The import dialog opens

#### Step 3: Configure Import Settings
| Setting | Description |
|---------|-------------|
| Width | Output width in characters |
| Height | Output height in characters |
| Charset | Character set for density |
| Threshold | Brightness cutoff |
| Invert | Swap light/dark |

#### Step 4: Preview and Adjust
1. See live preview as you adjust settings
2. Try different character sets:

**Standard characters:**
```
@@@@@@%%%%####****++++====----....    
```

**Block characters:**
```
████▓▓▓▓▒▒▒▒░░░░    
```

#### Step 5: Example Conversions

**Original: Simple face emoji**

With standard charset:
```
        @@@@@@@@        
    @@@@        @@@@    
  @@                @@  
  @@    @@    @@    @@  
@@                    @@
@@                    @@
@@    @@        @@    @@
  @@    @@@@@@@@    @@  
  @@                @@  
    @@@@        @@@@    
        @@@@@@@@        
```

With block charset:
```
        ████████        
    ████        ████    
  ██                ██  
  ██    ██    ██    ██  
██                    ██
██                    ██
██    ██        ██    ██
  ██    ████████    ██  
  ██                ██  
    ████        ████    
        ████████        
```

#### Step 6: Tips for Better Results
1. **Increase contrast** before importing
2. **Resize image** to approximate target dimensions
3. **Use appropriate charset** for the subject
4. **Adjust threshold** to balance detail
5. **Try inverting** if result looks wrong

#### Step 7: Post-Import Editing
After importing:
1. Use Eraser tool to clean up
2. Add outlines with box-drawing characters
3. Add text labels
4. Combine with other ASCII art

### Exercise
Convert a photo of your pet, logo, or favorite object to ASCII art.

---

## Next Steps

### Continue Learning
- Explore all tools in the toolbar
- Read the API documentation for scripting
- Check out the example documents

### Create Something Amazing
Now that you know the basics, try creating:
- A business card
- An organizational chart
- A technical diagram
- ASCII art portrait
- An infographic

### Share Your Work
Export your creations and share them:
- Plain text for forums and chat
- HTML for web pages
- PNG for social media
- SVG for scalable graphics

---

## Tips for Success

1. **Use keyboard shortcuts** - They speed up your workflow significantly
2. **Save often** - Press `Ctrl+S` regularly
3. **Use layers** - Keep your work organized
4. **Zoom in** - For detailed work, zoom to 200% or more
5. **Use guides** - Create guides for alignment
6. **Practice** - The more you use Asciistrator, the better you'll become

---

*Happy creating with Asciistrator!*
