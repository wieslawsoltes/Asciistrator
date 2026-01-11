/**
 * Asciistrator - Event Emitter
 * 
 * A simple pub/sub event system for decoupled communication between components.
 */

/**
 * Event emitter class for pub/sub pattern
 */
export class EventEmitter {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
        /** @type {Map<string, Set<Function>>} */
        this._onceListeners = new Map();
    }

    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} listener - Callback function
     * @returns {this}
     */
    on(event, listener) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(listener);
        return this;
    }

    /**
     * Add a one-time event listener
     * @param {string} event 
     * @param {Function} listener 
     * @returns {this}
     */
    once(event, listener) {
        if (!this._onceListeners.has(event)) {
            this._onceListeners.set(event, new Set());
        }
        this._onceListeners.get(event).add(listener);
        return this;
    }

    /**
     * Remove an event listener
     * @param {string} event 
     * @param {Function} listener 
     * @returns {this}
     */
    off(event, listener) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(listener);
        }
        if (this._onceListeners.has(event)) {
            this._onceListeners.get(event).delete(listener);
        }
        return this;
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Event name (all events if not specified)
     * @returns {this}
     */
    removeAllListeners(event) {
        if (event) {
            this._listeners.delete(event);
            this._onceListeners.delete(event);
        } else {
            this._listeners.clear();
            this._onceListeners.clear();
        }
        return this;
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to listeners
     * @returns {boolean} - True if event had listeners
     */
    emit(event, ...args) {
        let hadListeners = false;

        // Regular listeners
        if (this._listeners.has(event)) {
            for (const listener of this._listeners.get(event)) {
                try {
                    listener(...args);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
                hadListeners = true;
            }
        }

        // Once listeners
        if (this._onceListeners.has(event)) {
            const onceListeners = this._onceListeners.get(event);
            this._onceListeners.delete(event);
            for (const listener of onceListeners) {
                try {
                    listener(...args);
                } catch (error) {
                    console.error(`Error in once listener for "${event}":`, error);
                }
                hadListeners = true;
            }
        }

        return hadListeners;
    }

    /**
     * Get listener count for an event
     * @param {string} event 
     * @returns {number}
     */
    listenerCount(event) {
        let count = 0;
        if (this._listeners.has(event)) {
            count += this._listeners.get(event).size;
        }
        if (this._onceListeners.has(event)) {
            count += this._onceListeners.get(event).size;
        }
        return count;
    }

    /**
     * Get all event names with listeners
     * @returns {string[]}
     */
    eventNames() {
        return [...new Set([
            ...this._listeners.keys(),
            ...this._onceListeners.keys()
        ])];
    }

    /**
     * Alias for on()
     */
    addListener(event, listener) {
        return this.on(event, listener);
    }

    /**
     * Alias for off()
     */
    removeListener(event, listener) {
        return this.off(event, listener);
    }
}

/**
 * Global event bus for application-wide events
 */
export const globalEventBus = new EventEmitter();

export default EventEmitter;
