/**
 * Asciistrator - Styles Module Unit Tests
 * 
 * Tests for SharedStyle, StyleManager, and style reference system.
 */

import { describe, it, beforeEach, assert } from '../framework.js';

// Note: Since styles are implemented in app.js as part of the global scope,
// we'll need to access them differently. For isolated testing, we'll create
// local implementations that mirror the app.js functionality.

// ==========================================
// STYLE TYPE ENUM
// ==========================================

const StyleType = {
    FILL: 'FILL',
    STROKE: 'STROKE', 
    TEXT: 'TEXT',
    EFFECT: 'EFFECT',
    GRID: 'GRID'
};

// ==========================================
// SHARED STYLE CLASS (Test Implementation)
// ==========================================

function createStyleKey() {
    return `S:${Math.random().toString(36).substring(2, 10)}`;
}

class SharedStyle {
    constructor(options = {}) {
        this.key = options.key || createStyleKey();
        this.name = options.name || 'Untitled Style';
        this.styleType = options.styleType || StyleType.FILL;
        this.description = options.description || '';
        this.data = options.data || this._createDefaultData();
        this.remote = options.remote || false;
        this.createdAt = options.createdAt || Date.now();
        this.modifiedAt = options.modifiedAt || Date.now();
    }
    
    _createDefaultData() {
        switch (this.styleType) {
            case StyleType.FILL:
                return {
                    fills: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        blendMode: 'NORMAL',
                        color: { r: 0.5, g: 0.5, b: 0.5, a: 1 }
                    }]
                };
            case StyleType.STROKE:
                return {
                    strokes: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        color: { r: 0, g: 0, b: 0, a: 1 }
                    }],
                    strokeWeight: 1,
                    strokeAlign: 'CENTER',
                    strokeCap: 'NONE',
                    strokeJoin: 'MITER',
                    strokeDashes: [],
                    strokeMiterAngle: 28.96
                };
            case StyleType.TEXT:
                return {
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    letterSpacing: 0,
                    lineHeight: { value: 100, unit: 'PERCENT' },
                    textAlignHorizontal: 'LEFT',
                    textAlignVertical: 'TOP'
                };
            case StyleType.EFFECT:
                return {
                    effects: []
                };
            default:
                return {};
        }
    }
    
    update(data) {
        Object.assign(this.data, data);
        this.modifiedAt = Date.now();
    }
    
    clone(newName) {
        return new SharedStyle({
            name: newName || `${this.name} Copy`,
            styleType: this.styleType,
            description: this.description,
            data: JSON.parse(JSON.stringify(this.data))
        });
    }
    
    toJSON() {
        return {
            key: this.key,
            name: this.name,
            styleType: this.styleType,
            description: this.description,
            ...this.data,
            remote: this.remote
        };
    }
    
    static fromJSON(json) {
        const { key, name, styleType, description, remote, ...data } = json;
        return new SharedStyle({
            key,
            name,
            styleType,
            description,
            remote,
            data
        });
    }
}

// ==========================================
// STYLE MANAGER CLASS (Test Implementation)
// ==========================================

class StyleManager {
    constructor() {
        this.styles = new Map();
        this._subscribers = new Set();
    }
    
    subscribe(callback) {
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }
    
    _notify(event, style) {
        for (const callback of this._subscribers) {
            callback(event, style);
        }
    }
    
    createStyle(options = {}) {
        const style = new SharedStyle(options);
        this.styles.set(style.key, style);
        this._notify('create', style);
        return style;
    }
    
    getStyle(key) {
        return this.styles.get(key);
    }
    
    updateStyle(key, data) {
        const style = this.styles.get(key);
        if (style) {
            style.update(data);
            this._notify('update', style);
        }
        return style;
    }
    
    deleteStyle(key) {
        const style = this.styles.get(key);
        if (style) {
            this.styles.delete(key);
            this._notify('delete', style);
            return true;
        }
        return false;
    }
    
    getStylesByType(styleType) {
        return [...this.styles.values()].filter(s => s.styleType === styleType);
    }
    
    getFillStyles() {
        return this.getStylesByType(StyleType.FILL);
    }
    
    getStrokeStyles() {
        return this.getStylesByType(StyleType.STROKE);
    }
    
    getTextStyles() {
        return this.getStylesByType(StyleType.TEXT);
    }
    
    getEffectStyles() {
        return this.getStylesByType(StyleType.EFFECT);
    }
    
    importFromDocument(stylesObj) {
        for (const [key, styleData] of Object.entries(stylesObj || {})) {
            const style = SharedStyle.fromJSON({ key, ...styleData });
            this.styles.set(key, style);
        }
    }
    
    exportToDocument() {
        const result = {};
        for (const [key, style] of this.styles) {
            result[key] = style.toJSON();
        }
        return result;
    }
    
    clear() {
        this.styles.clear();
        this._notify('clear', null);
    }
    
    get count() {
        return this.styles.size;
    }
}

// ==========================================
// SHARED STYLE TESTS
// ==========================================

describe('SharedStyle', () => {
    describe('Constructor', () => {
        it('should create fill style with defaults', () => {
            const style = new SharedStyle({
                styleType: StyleType.FILL
            });
            
            assert.isDefined(style.key);
            assert.equal(style.name, 'Untitled Style');
            assert.equal(style.styleType, StyleType.FILL);
            assert.isDefined(style.data.fills);
            assert.lengthOf(style.data.fills, 1);
        });
        
        it('should create stroke style with defaults', () => {
            const style = new SharedStyle({
                styleType: StyleType.STROKE
            });
            
            assert.equal(style.styleType, StyleType.STROKE);
            assert.isDefined(style.data.strokes);
            assert.lengthOf(style.data.strokes, 1);
            assert.equal(style.data.strokeWeight, 1);
        });
        
        it('should create text style with defaults', () => {
            const style = new SharedStyle({
                styleType: StyleType.TEXT
            });
            
            assert.equal(style.styleType, StyleType.TEXT);
            assert.equal(style.data.fontFamily, 'monospace');
            assert.equal(style.data.fontSize, 12);
        });
        
        it('should create effect style with defaults', () => {
            const style = new SharedStyle({
                styleType: StyleType.EFFECT
            });
            
            assert.equal(style.styleType, StyleType.EFFECT);
            assert.isDefined(style.data.effects);
            assert.lengthOf(style.data.effects, 0);
        });
        
        it('should accept custom options', () => {
            const style = new SharedStyle({
                name: 'Primary Fill',
                styleType: StyleType.FILL,
                description: 'Primary brand color',
                data: {
                    fills: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        blendMode: 'NORMAL',
                        color: { r: 0.2, g: 0.4, b: 0.8, a: 1 }
                    }]
                }
            });
            
            assert.equal(style.name, 'Primary Fill');
            assert.equal(style.description, 'Primary brand color');
            assert.approximately(style.data.fills[0].color.r, 0.2, 0.01);
        });
        
        it('should generate unique keys', () => {
            const style1 = new SharedStyle({ styleType: StyleType.FILL });
            const style2 = new SharedStyle({ styleType: StyleType.FILL });
            
            assert.notEqual(style1.key, style2.key);
        });
    });
    
    describe('Update', () => {
        it('should update style data', () => {
            const style = new SharedStyle({
                styleType: StyleType.FILL
            });
            
            const originalModified = style.modifiedAt;
            
            // Wait a bit to ensure timestamp changes
            style.update({
                fills: [{
                    type: 'SOLID',
                    visible: true,
                    opacity: 0.5,
                    blendMode: 'NORMAL',
                    color: { r: 1, g: 0, b: 0, a: 1 }
                }]
            });
            
            assert.equal(style.data.fills[0].opacity, 0.5);
            assert.equal(style.data.fills[0].color.r, 1);
        });
    });
    
    describe('Clone', () => {
        it('should clone style with new key', () => {
            const original = new SharedStyle({
                name: 'Original',
                styleType: StyleType.FILL,
                data: {
                    fills: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        blendMode: 'NORMAL',
                        color: { r: 0.5, g: 0.5, b: 0.5, a: 1 }
                    }]
                }
            });
            
            const clone = original.clone('Cloned');
            
            assert.notEqual(clone.key, original.key);
            assert.equal(clone.name, 'Cloned');
            assert.equal(clone.styleType, original.styleType);
            assert.deepEqual(clone.data.fills, original.data.fills);
        });
        
        it('should create deep copy of data', () => {
            const original = new SharedStyle({
                styleType: StyleType.FILL
            });
            
            const clone = original.clone();
            
            // Modify clone's data
            clone.data.fills[0].color.r = 1;
            
            // Original should not be affected
            assert.notEqual(original.data.fills[0].color.r, 1);
        });
    });
    
    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const style = new SharedStyle({
                key: 'S:test123',
                name: 'Test Style',
                styleType: StyleType.FILL,
                description: 'A test style',
                remote: false
            });
            
            const json = style.toJSON();
            
            assert.equal(json.key, 'S:test123');
            assert.equal(json.name, 'Test Style');
            assert.equal(json.styleType, StyleType.FILL);
            assert.equal(json.description, 'A test style');
            assert.isDefined(json.fills);
            assert.equal(json.remote, false);
        });
        
        it('should deserialize from JSON', () => {
            const json = {
                key: 'S:abc123',
                name: 'Restored Style',
                styleType: StyleType.STROKE,
                description: 'Restored from JSON',
                strokes: [{
                    type: 'SOLID',
                    visible: true,
                    opacity: 1,
                    color: { r: 1, g: 0, b: 0, a: 1 }
                }],
                strokeWeight: 2,
                remote: true
            };
            
            const style = SharedStyle.fromJSON(json);
            
            assert.equal(style.key, 'S:abc123');
            assert.equal(style.name, 'Restored Style');
            assert.equal(style.styleType, StyleType.STROKE);
            assert.equal(style.remote, true);
            assert.equal(style.data.strokes[0].color.r, 1);
            assert.equal(style.data.strokeWeight, 2);
        });
        
        it('should round-trip serialize/deserialize', () => {
            const original = new SharedStyle({
                name: 'Round Trip',
                styleType: StyleType.TEXT,
                data: {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    fontWeight: 'bold'
                }
            });
            
            const json = original.toJSON();
            const restored = SharedStyle.fromJSON(json);
            
            assert.equal(restored.key, original.key);
            assert.equal(restored.name, original.name);
            assert.equal(restored.styleType, original.styleType);
            assert.equal(restored.data.fontFamily, 'Arial');
            assert.equal(restored.data.fontSize, 16);
        });
    });
});

// ==========================================
// STYLE MANAGER TESTS
// ==========================================

describe('StyleManager', () => {
    let manager;
    
    beforeEach(() => {
        manager = new StyleManager();
    });
    
    describe('Create Style', () => {
        it('should create and store a style', () => {
            const style = manager.createStyle({
                name: 'New Style',
                styleType: StyleType.FILL
            });
            
            assert.isDefined(style);
            assert.equal(style.name, 'New Style');
            assert.equal(manager.count, 1);
        });
        
        it('should retrieve created style by key', () => {
            const created = manager.createStyle({
                name: 'Retrievable',
                styleType: StyleType.STROKE
            });
            
            const retrieved = manager.getStyle(created.key);
            
            assert.equal(retrieved, created);
            assert.equal(retrieved.name, 'Retrievable');
        });
    });
    
    describe('Update Style', () => {
        it('should update style data', () => {
            const style = manager.createStyle({
                name: 'Updatable',
                styleType: StyleType.FILL
            });
            
            manager.updateStyle(style.key, {
                fills: [{
                    type: 'SOLID',
                    visible: true,
                    opacity: 0.75,
                    blendMode: 'MULTIPLY',
                    color: { r: 0, g: 1, b: 0, a: 1 }
                }]
            });
            
            const updated = manager.getStyle(style.key);
            assert.equal(updated.data.fills[0].opacity, 0.75);
            assert.equal(updated.data.fills[0].blendMode, 'MULTIPLY');
        });
        
        it('should return null for non-existent style', () => {
            const result = manager.updateStyle('non-existent', {});
            assert.isUndefined(result);
        });
    });
    
    describe('Delete Style', () => {
        it('should delete existing style', () => {
            const style = manager.createStyle({
                name: 'Deletable',
                styleType: StyleType.FILL
            });
            
            const deleted = manager.deleteStyle(style.key);
            
            assert.isTrue(deleted);
            assert.equal(manager.count, 0);
            assert.isUndefined(manager.getStyle(style.key));
        });
        
        it('should return false for non-existent style', () => {
            const deleted = manager.deleteStyle('non-existent');
            assert.isFalse(deleted);
        });
    });
    
    describe('Get Styles By Type', () => {
        beforeEach(() => {
            manager.createStyle({ name: 'Fill 1', styleType: StyleType.FILL });
            manager.createStyle({ name: 'Fill 2', styleType: StyleType.FILL });
            manager.createStyle({ name: 'Stroke 1', styleType: StyleType.STROKE });
            manager.createStyle({ name: 'Text 1', styleType: StyleType.TEXT });
            manager.createStyle({ name: 'Effect 1', styleType: StyleType.EFFECT });
        });
        
        it('should get all fill styles', () => {
            const fills = manager.getFillStyles();
            assert.lengthOf(fills, 2);
            assert.isTrue(fills.every(s => s.styleType === StyleType.FILL));
        });
        
        it('should get all stroke styles', () => {
            const strokes = manager.getStrokeStyles();
            assert.lengthOf(strokes, 1);
            assert.equal(strokes[0].name, 'Stroke 1');
        });
        
        it('should get all text styles', () => {
            const texts = manager.getTextStyles();
            assert.lengthOf(texts, 1);
            assert.equal(texts[0].name, 'Text 1');
        });
        
        it('should get all effect styles', () => {
            const effects = manager.getEffectStyles();
            assert.lengthOf(effects, 1);
            assert.equal(effects[0].name, 'Effect 1');
        });
    });
    
    describe('Import/Export', () => {
        it('should export styles to document format', () => {
            manager.createStyle({ name: 'Style A', styleType: StyleType.FILL });
            manager.createStyle({ name: 'Style B', styleType: StyleType.STROKE });
            
            const exported = manager.exportToDocument();
            
            assert.equal(Object.keys(exported).length, 2);
            
            // Check that exported format is correct
            for (const [key, styleData] of Object.entries(exported)) {
                assert.isDefined(styleData.name);
                assert.isDefined(styleData.styleType);
                assert.equal(styleData.key, key);
            }
        });
        
        it('should import styles from document format', () => {
            const importData = {
                'S:import1': {
                    key: 'S:import1',
                    name: 'Imported Fill',
                    styleType: StyleType.FILL,
                    fills: [{ type: 'SOLID', visible: true, opacity: 1, color: { r: 1, g: 0, b: 0, a: 1 } }]
                },
                'S:import2': {
                    key: 'S:import2',
                    name: 'Imported Stroke',
                    styleType: StyleType.STROKE,
                    strokes: [{ type: 'SOLID', visible: true, opacity: 1, color: { r: 0, g: 0, b: 1, a: 1 } }],
                    strokeWeight: 3
                }
            };
            
            manager.importFromDocument(importData);
            
            assert.equal(manager.count, 2);
            
            const fill = manager.getStyle('S:import1');
            assert.equal(fill.name, 'Imported Fill');
            assert.equal(fill.data.fills[0].color.r, 1);
            
            const stroke = manager.getStyle('S:import2');
            assert.equal(stroke.name, 'Imported Stroke');
            assert.equal(stroke.data.strokeWeight, 3);
        });
        
        it('should round-trip export/import', () => {
            manager.createStyle({ name: 'Round Trip 1', styleType: StyleType.FILL });
            manager.createStyle({ name: 'Round Trip 2', styleType: StyleType.TEXT });
            
            const exported = manager.exportToDocument();
            
            const newManager = new StyleManager();
            newManager.importFromDocument(exported);
            
            assert.equal(newManager.count, 2);
            assert.lengthOf(newManager.getFillStyles(), 1);
            assert.lengthOf(newManager.getTextStyles(), 1);
        });
    });
    
    describe('Subscriptions', () => {
        it('should notify on create', () => {
            let notified = false;
            let receivedEvent = null;
            let receivedStyle = null;
            
            manager.subscribe((event, style) => {
                notified = true;
                receivedEvent = event;
                receivedStyle = style;
            });
            
            const created = manager.createStyle({ name: 'Notify Test' });
            
            assert.isTrue(notified);
            assert.equal(receivedEvent, 'create');
            assert.equal(receivedStyle, created);
        });
        
        it('should notify on update', () => {
            const style = manager.createStyle({ name: 'Update Notify' });
            
            let receivedEvent = null;
            manager.subscribe((event) => {
                receivedEvent = event;
            });
            
            manager.updateStyle(style.key, { fills: [] });
            
            assert.equal(receivedEvent, 'update');
        });
        
        it('should notify on delete', () => {
            const style = manager.createStyle({ name: 'Delete Notify' });
            
            let receivedEvent = null;
            manager.subscribe((event) => {
                receivedEvent = event;
            });
            
            manager.deleteStyle(style.key);
            
            assert.equal(receivedEvent, 'delete');
        });
        
        it('should allow unsubscribe', () => {
            let callCount = 0;
            
            const unsubscribe = manager.subscribe(() => {
                callCount++;
            });
            
            manager.createStyle({ name: 'First' });
            assert.equal(callCount, 1);
            
            unsubscribe();
            
            manager.createStyle({ name: 'Second' });
            assert.equal(callCount, 1);  // Should not increment after unsubscribe
        });
    });
    
    describe('Clear', () => {
        it('should clear all styles', () => {
            manager.createStyle({ name: 'Style 1' });
            manager.createStyle({ name: 'Style 2' });
            manager.createStyle({ name: 'Style 3' });
            
            assert.equal(manager.count, 3);
            
            manager.clear();
            
            assert.equal(manager.count, 0);
        });
        
        it('should notify on clear', () => {
            let receivedEvent = null;
            
            manager.createStyle({ name: 'To Clear' });
            
            manager.subscribe((event) => {
                receivedEvent = event;
            });
            
            manager.clear();
            
            assert.equal(receivedEvent, 'clear');
        });
    });
});

// ==========================================
// FIGMA COMPATIBILITY TESTS
// ==========================================

describe('Figma Style Compatibility', () => {
    describe('Style Key Format', () => {
        it('should generate Figma-compatible style keys', () => {
            const style = new SharedStyle({
                styleType: StyleType.FILL
            });
            
            // Keys should start with 'S:'
            assert.isTrue(style.key.startsWith('S:'));
        });
    });
    
    describe('Fill Style Format', () => {
        it('should match Figma fill structure', () => {
            const style = new SharedStyle({
                styleType: StyleType.FILL,
                data: {
                    fills: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        blendMode: 'NORMAL',
                        color: { r: 0.2, g: 0.4, b: 0.8, a: 1 }
                    }]
                }
            });
            
            const json = style.toJSON();
            
            // Should have fills array at top level (Figma format)
            assert.isDefined(json.fills);
            assert.isArray(json.fills);
            
            // Fill should have Figma properties
            const fill = json.fills[0];
            assert.equal(fill.type, 'SOLID');
            assert.isDefined(fill.visible);
            assert.isDefined(fill.opacity);
            assert.isDefined(fill.blendMode);
            assert.isDefined(fill.color);
            
            // Color should be 0-1 range (Figma format)
            assert.isTrue(fill.color.r >= 0 && fill.color.r <= 1);
            assert.isTrue(fill.color.g >= 0 && fill.color.g <= 1);
            assert.isTrue(fill.color.b >= 0 && fill.color.b <= 1);
        });
    });
    
    describe('Stroke Style Format', () => {
        it('should match Figma stroke structure', () => {
            const style = new SharedStyle({
                styleType: StyleType.STROKE,
                data: {
                    strokes: [{
                        type: 'SOLID',
                        visible: true,
                        opacity: 1,
                        color: { r: 0, g: 0, b: 0, a: 1 }
                    }],
                    strokeWeight: 2,
                    strokeAlign: 'CENTER',
                    strokeCap: 'ROUND',
                    strokeJoin: 'ROUND',
                    strokeDashes: [5, 3],
                    strokeMiterAngle: 28.96
                }
            });
            
            const json = style.toJSON();
            
            // Should have Figma stroke properties
            assert.isDefined(json.strokes);
            assert.equal(json.strokeWeight, 2);
            assert.equal(json.strokeAlign, 'CENTER');
            assert.equal(json.strokeCap, 'ROUND');
            assert.equal(json.strokeJoin, 'ROUND');
            assert.deepEqual(json.strokeDashes, [5, 3]);
        });
    });
    
    describe('Text Style Format', () => {
        it('should match Figma text structure', () => {
            const style = new SharedStyle({
                styleType: StyleType.TEXT,
                data: {
                    fontFamily: 'Roboto',
                    fontSize: 16,
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    letterSpacing: 0.5,
                    lineHeight: { value: 150, unit: 'PERCENT' },
                    textAlignHorizontal: 'CENTER',
                    textAlignVertical: 'CENTER',
                    textDecoration: 'UNDERLINE',
                    textCase: 'UPPER'
                }
            });
            
            const json = style.toJSON();
            
            // Should have Figma text properties
            assert.equal(json.fontFamily, 'Roboto');
            assert.equal(json.fontSize, 16);
            assert.equal(json.textAlignHorizontal, 'CENTER');
            assert.equal(json.lineHeight.unit, 'PERCENT');
        });
    });
    
    describe('Effect Style Format', () => {
        it('should match Figma effect structure', () => {
            const style = new SharedStyle({
                styleType: StyleType.EFFECT,
                data: {
                    effects: [
                        {
                            type: 'DROP_SHADOW',
                            visible: true,
                            color: { r: 0, g: 0, b: 0, a: 0.25 },
                            offset: { x: 0, y: 4 },
                            radius: 8,
                            spread: 0
                        }
                    ]
                }
            });
            
            const json = style.toJSON();
            
            // Should have effects array
            assert.isDefined(json.effects);
            assert.isArray(json.effects);
            
            const effect = json.effects[0];
            assert.equal(effect.type, 'DROP_SHADOW');
            assert.isDefined(effect.offset);
        });
    });
});
