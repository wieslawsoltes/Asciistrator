/**
 * Asciistrator - Text Tool
 * 
 * Tool for creating and editing text objects.
 */

import { Vector2D } from '../core/math/vector2d.js';
import { Tool, ToolCursors } from './base.js';
import { Text } from '../objects/text.js';

// ==========================================
// TEXT TOOL
// ==========================================

/**
 * TextTool - Create and edit text objects
 */
export class TextTool extends Tool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'text',
            name: 'Text',
            description: 'Create and edit text',
            shortcut: 't',
            icon: 'T',
            cursor: ToolCursors.TEXT,
            ...options
        });

        /** @type {Text|null} Text being created/edited */
        this._activeText = null;

        /** @type {boolean} Is in edit mode */
        this._editing = false;

        /** @type {number} Cursor position in text */
        this._cursorPos = 0;

        /** @type {number} Selection start */
        this._selectionStart = 0;

        /** @type {number} Selection end */
        this._selectionEnd = 0;

        /** @type {boolean} Cursor blink state */
        this._cursorVisible = true;

        /** @type {number} Cursor blink interval */
        this._cursorBlink = null;

        // Text properties
        /** @type {string} Font family (ASCII art font) */
        this.fontFamily = options.fontFamily || 'standard';

        /** @type {number} Font size (character scale) */
        this.fontSize = options.fontSize || 1;

        /** @type {string} Text alignment */
        this.alignment = options.alignment || 'left';
    }

    activate() {
        super.activate();
        this._startCursorBlink();
    }

    deactivate() {
        this._finishEditing();
        this._stopCursorBlink();
        super.deactivate();
    }

    _startCursorBlink() {
        this._stopCursorBlink();
        this._cursorBlink = setInterval(() => {
            this._cursorVisible = !this._cursorVisible;
            if (this._editing) {
                this.requestRedraw();
            }
        }, 530);
    }

    _stopCursorBlink() {
        if (this._cursorBlink) {
            clearInterval(this._cursorBlink);
            this._cursorBlink = null;
        }
    }

    getCursor() {
        return ToolCursors.TEXT;
    }

    onClick(event) {
        const point = this.state.currentPoint;

        // Check if clicking on existing text
        const hit = this.hitTest(point);

        if (hit && hit.type === 'object' && hit.object.type === 'text') {
            // Edit existing text
            this._startEditing(hit.object);
            return;
        }

        if (this._editing) {
            // Click elsewhere - finish editing
            this._finishEditing();
        }

        // Create new text at click position
        let pos = point;
        if (this.manager.snapToGrid) {
            pos = this.snapToGrid(pos);
        }

        const text = new Text({
            x: pos.x,
            y: pos.y,
            content: '',
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            alignment: this.alignment
        });

        this._activeText = text;
        this._startEditing(text);

        this.beginAction('Create text');
    }

    onDoubleClick(event) {
        // Select word at cursor
        if (this._editing && this._activeText) {
            const content = this._activeText.content;
            const pos = this._cursorPos;

            // Find word boundaries
            let start = pos;
            let end = pos;

            while (start > 0 && /\w/.test(content[start - 1])) {
                start--;
            }
            while (end < content.length && /\w/.test(content[end])) {
                end++;
            }

            this._selectionStart = start;
            this._selectionEnd = end;
            this._cursorPos = end;

            this.requestRedraw();
        }
    }

    _startEditing(text) {
        this._activeText = text;
        this._editing = true;
        this._cursorPos = text.content.length;
        this._selectionStart = 0;
        this._selectionEnd = 0;
        this._cursorVisible = true;

        // Select the text object
        if (this.selection) {
            this.selection.clear();
            this.selection.select(text);
        }

        this.emit('editingStarted', text);
        this.requestRedraw();
    }

    _finishEditing() {
        if (!this._editing || !this._activeText) return;

        if (this._activeText.content.trim() === '') {
            // Remove empty text
            if (this._activeText.parent) {
                this.removeObject(this._activeText);
            }
        } else {
            // Add to document if new
            if (!this._activeText.parent) {
                this.addObject(this._activeText);

                if (this.selection) {
                    this.selection.clear();
                    this.selection.select(this._activeText);
                }
            }
        }

        this._activeText.invalidate();
        this._editing = false;
        this._activeText = null;
        this._cursorPos = 0;
        this._selectionStart = 0;
        this._selectionEnd = 0;

        this.endAction();
        this.emit('editingFinished');
        this.requestRedraw();
    }

    onKeyDown(event) {
        if (!this._editing || !this._activeText) {
            return super.onKeyDown(event);
        }

        const content = this._activeText.content;
        const hasSelection = this._selectionStart !== this._selectionEnd;

        // Handle special keys
        switch (event.key) {
            case 'Escape':
                this._finishEditing();
                return true;

            case 'Enter':
                if (event.shiftKey) {
                    // Insert newline
                    this._insertText('\n');
                } else {
                    // Finish editing
                    this._finishEditing();
                }
                return true;

            case 'Backspace':
                if (hasSelection) {
                    this._deleteSelection();
                } else if (this._cursorPos > 0) {
                    this._activeText.content =
                        content.slice(0, this._cursorPos - 1) +
                        content.slice(this._cursorPos);
                    this._cursorPos--;
                }
                this._activeText.invalidate();
                this.requestRedraw();
                return true;

            case 'Delete':
                if (hasSelection) {
                    this._deleteSelection();
                } else if (this._cursorPos < content.length) {
                    this._activeText.content =
                        content.slice(0, this._cursorPos) +
                        content.slice(this._cursorPos + 1);
                }
                this._activeText.invalidate();
                this.requestRedraw();
                return true;

            case 'ArrowLeft':
                if (event.shiftKey) {
                    this._extendSelection(-1);
                } else {
                    if (hasSelection) {
                        this._cursorPos = Math.min(this._selectionStart, this._selectionEnd);
                        this._clearSelection();
                    } else if (this._cursorPos > 0) {
                        this._cursorPos--;
                    }
                }
                this.requestRedraw();
                return true;

            case 'ArrowRight':
                if (event.shiftKey) {
                    this._extendSelection(1);
                } else {
                    if (hasSelection) {
                        this._cursorPos = Math.max(this._selectionStart, this._selectionEnd);
                        this._clearSelection();
                    } else if (this._cursorPos < content.length) {
                        this._cursorPos++;
                    }
                }
                this.requestRedraw();
                return true;

            case 'ArrowUp':
                // Move to previous line
                this._moveCursorVertical(-1, event.shiftKey);
                this.requestRedraw();
                return true;

            case 'ArrowDown':
                // Move to next line
                this._moveCursorVertical(1, event.shiftKey);
                this.requestRedraw();
                return true;

            case 'Home':
                if (event.shiftKey) {
                    this._selectionEnd = this._cursorPos;
                    this._selectionStart = 0;
                    this._cursorPos = 0;
                } else {
                    this._cursorPos = 0;
                    this._clearSelection();
                }
                this.requestRedraw();
                return true;

            case 'End':
                if (event.shiftKey) {
                    this._selectionStart = this._cursorPos;
                    this._selectionEnd = content.length;
                    this._cursorPos = content.length;
                } else {
                    this._cursorPos = content.length;
                    this._clearSelection();
                }
                this.requestRedraw();
                return true;

            case 'a':
                if (event.ctrlKey || event.metaKey) {
                    // Select all
                    this._selectionStart = 0;
                    this._selectionEnd = content.length;
                    this._cursorPos = content.length;
                    this.requestRedraw();
                    return true;
                }
                break;

            case 'c':
                if (event.ctrlKey || event.metaKey) {
                    // Copy
                    if (hasSelection) {
                        const start = Math.min(this._selectionStart, this._selectionEnd);
                        const end = Math.max(this._selectionStart, this._selectionEnd);
                        navigator.clipboard.writeText(content.slice(start, end));
                    }
                    return true;
                }
                break;

            case 'x':
                if (event.ctrlKey || event.metaKey) {
                    // Cut
                    if (hasSelection) {
                        const start = Math.min(this._selectionStart, this._selectionEnd);
                        const end = Math.max(this._selectionStart, this._selectionEnd);
                        navigator.clipboard.writeText(content.slice(start, end));
                        this._deleteSelection();
                        this._activeText.invalidate();
                        this.requestRedraw();
                    }
                    return true;
                }
                break;

            case 'v':
                if (event.ctrlKey || event.metaKey) {
                    // Paste
                    navigator.clipboard.readText().then(text => {
                        if (text) {
                            this._insertText(text);
                        }
                    });
                    return true;
                }
                break;
        }

        // Handle regular character input
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            this._insertText(event.key);
            return true;
        }

        return false;
    }

    _insertText(text) {
        if (!this._activeText) return;

        const content = this._activeText.content;
        const hasSelection = this._selectionStart !== this._selectionEnd;

        if (hasSelection) {
            // Replace selection
            const start = Math.min(this._selectionStart, this._selectionEnd);
            const end = Math.max(this._selectionStart, this._selectionEnd);
            this._activeText.content = content.slice(0, start) + text + content.slice(end);
            this._cursorPos = start + text.length;
            this._clearSelection();
        } else {
            // Insert at cursor
            this._activeText.content =
                content.slice(0, this._cursorPos) +
                text +
                content.slice(this._cursorPos);
            this._cursorPos += text.length;
        }

        this._activeText.invalidate();
        this.requestRedraw();
    }

    _deleteSelection() {
        if (!this._activeText) return;

        const content = this._activeText.content;
        const start = Math.min(this._selectionStart, this._selectionEnd);
        const end = Math.max(this._selectionStart, this._selectionEnd);

        this._activeText.content = content.slice(0, start) + content.slice(end);
        this._cursorPos = start;
        this._clearSelection();
    }

    _clearSelection() {
        this._selectionStart = 0;
        this._selectionEnd = 0;
    }

    _extendSelection(delta) {
        if (this._selectionStart === this._selectionEnd) {
            this._selectionStart = this._cursorPos;
        }

        const content = this._activeText.content;
        this._cursorPos = Math.max(0, Math.min(content.length, this._cursorPos + delta));
        this._selectionEnd = this._cursorPos;
    }

    _moveCursorVertical(direction, extendSelection) {
        if (!this._activeText) return;

        const content = this._activeText.content;
        const lines = content.split('\n');

        // Find current line and column
        let currentLine = 0;
        let currentCol = 0;
        let pos = 0;

        for (let i = 0; i < lines.length; i++) {
            if (pos + lines[i].length >= this._cursorPos) {
                currentLine = i;
                currentCol = this._cursorPos - pos;
                break;
            }
            pos += lines[i].length + 1; // +1 for newline
        }

        // Move to target line
        const targetLine = Math.max(0, Math.min(lines.length - 1, currentLine + direction));
        const targetCol = Math.min(currentCol, lines[targetLine].length);

        // Calculate new cursor position
        let newPos = 0;
        for (let i = 0; i < targetLine; i++) {
            newPos += lines[i].length + 1;
        }
        newPos += targetCol;

        if (extendSelection) {
            if (this._selectionStart === this._selectionEnd) {
                this._selectionStart = this._cursorPos;
            }
            this._selectionEnd = newPos;
        } else {
            this._clearSelection();
        }

        this._cursorPos = newPos;
    }

    render(ctx) {
        if (!this._editing || !this._activeText || !ctx.setChar) return;

        // Render text content (handled by object itself)
        if (this._activeText.rasterize) {
            this._activeText.rasterize(ctx);
        }

        // Render selection highlight
        if (this._selectionStart !== this._selectionEnd) {
            this._renderSelection(ctx);
        }

        // Render cursor
        if (this._cursorVisible) {
            this._renderCursor(ctx);
        }
    }

    _renderSelection(ctx) {
        const text = this._activeText;
        const content = text.content;
        const start = Math.min(this._selectionStart, this._selectionEnd);
        const end = Math.max(this._selectionStart, this._selectionEnd);

        // Calculate selection positions
        const lines = content.split('\n');
        let lineY = Math.floor(text.y);
        let charX = Math.floor(text.x);
        let pos = 0;

        for (const line of lines) {
            const lineStart = pos;
            const lineEnd = pos + line.length;

            // Check if selection intersects this line
            if (start < lineEnd && end > lineStart) {
                const selStart = Math.max(start, lineStart) - lineStart;
                const selEnd = Math.min(end, lineEnd) - lineStart;

                // Highlight selected characters
                for (let i = selStart; i < selEnd; i++) {
                    ctx.setChar(charX + i, lineY, line[i] || ' ', { highlight: true });
                }
            }

            lineY++;
            pos = lineEnd + 1; // +1 for newline
        }
    }

    _renderCursor(ctx) {
        const text = this._activeText;
        const content = text.content;

        // Calculate cursor position
        const lines = content.split('\n');
        let lineY = Math.floor(text.y);
        let charX = Math.floor(text.x);
        let pos = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineEnd = pos + lines[i].length;

            if (this._cursorPos <= lineEnd) {
                charX += this._cursorPos - pos;
                lineY += i;
                break;
            }

            pos = lineEnd + 1;
        }

        // Draw cursor
        ctx.setChar(charX, lineY, '▏');
    }

    /**
     * Set font family
     * @param {string} family
     */
    setFontFamily(family) {
        this.fontFamily = family;
        if (this._activeText) {
            this._activeText.fontFamily = family;
            this._activeText.invalidate();
            this.requestRedraw();
        }
        this.emit('fontFamilyChanged', family);
    }

    /**
     * Set font size
     * @param {number} size
     */
    setFontSize(size) {
        this.fontSize = Math.max(1, size);
        if (this._activeText) {
            this._activeText.fontSize = this.fontSize;
            this._activeText.invalidate();
            this.requestRedraw();
        }
        this.emit('fontSizeChanged', this.fontSize);
    }

    /**
     * Set text alignment
     * @param {string} alignment
     */
    setAlignment(alignment) {
        this.alignment = alignment;
        if (this._activeText) {
            this._activeText.alignment = alignment;
            this._activeText.invalidate();
            this.requestRedraw();
        }
        this.emit('alignmentChanged', alignment);
    }
}

// ==========================================
// ASCII ART TEXT TOOL
// ==========================================

/**
 * AsciiArtTextTool - Create FIGlet-style ASCII art text
 */
export class AsciiArtTextTool extends TextTool {
    constructor(manager, options = {}) {
        super(manager, {
            id: 'ascii-art-text',
            name: 'ASCII Art Text',
            description: 'Create FIGlet-style text',
            shortcut: 'ctrl+t',
            icon: '𝔸',
            fontFamily: 'banner',
            ...options
        });
    }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
    TextTool,
    AsciiArtTextTool
};
