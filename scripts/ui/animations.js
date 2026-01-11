/**
 * Asciistrator - Animation System
 * 
 * Smooth animations and transitions for UI elements.
 */

// ==========================================
// EASING FUNCTIONS
// ==========================================

/**
 * Collection of easing functions
 */
export const Easing = {
    // Linear
    linear: t => t,
    
    // Quadratic
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    // Cubic
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    // Quartic
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    
    // Quintic
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    
    // Sine
    easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: t => Math.sin(t * Math.PI / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    
    // Exponential
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return t < 0.5 
            ? Math.pow(2, 20 * t - 10) / 2 
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    
    // Circular
    easeInCirc: t => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: t => Math.sqrt(1 - (--t) * t),
    easeInOutCirc: t => t < 0.5 
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 
        : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
    
    // Back (overshoot)
    easeInBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    
    // Elastic
    easeInElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const c4 = (2 * Math.PI) / 3;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const c4 = (2 * Math.PI) / 3;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInOutElastic: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        const c5 = (2 * Math.PI) / 4.5;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    },
    
    // Bounce
    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
    easeInOutBounce: t => t < 0.5
        ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
        : (1 + Easing.easeOutBounce(2 * t - 1)) / 2
};

// ==========================================
// TWEEN
// ==========================================

/**
 * Tween - animates values over time
 */
export class Tween {
    /**
     * @param {object} target - Object with properties to animate
     * @param {object} properties - Target property values
     * @param {object} options - Animation options
     */
    constructor(target, properties, options = {}) {
        this.target = target;
        this.properties = properties;
        this.duration = options.duration || 300;
        this.easing = options.easing || Easing.easeOutQuad;
        this.delay = options.delay || 0;
        this.onUpdate = options.onUpdate || null;
        this.onComplete = options.onComplete || null;
        
        /** @type {object} Initial values */
        this._startValues = {};
        /** @type {number} Start time */
        this._startTime = null;
        /** @type {boolean} */
        this._running = false;
        /** @type {boolean} */
        this._completed = false;
        /** @type {number} */
        this._rafId = null;
    }

    /**
     * Start the animation
     * @returns {Promise<void>}
     */
    start() {
        return new Promise((resolve) => {
            // Store initial values
            for (const key in this.properties) {
                this._startValues[key] = this.target[key];
            }
            
            this._running = true;
            this._completed = false;
            this._startTime = null;
            
            const animate = (timestamp) => {
                if (!this._running) {
                    resolve();
                    return;
                }
                
                if (!this._startTime) {
                    this._startTime = timestamp + this.delay;
                }
                
                // Handle delay
                if (timestamp < this._startTime) {
                    this._rafId = requestAnimationFrame(animate);
                    return;
                }
                
                const elapsed = timestamp - this._startTime;
                let progress = Math.min(elapsed / this.duration, 1);
                
                // Apply easing
                const easedProgress = this.easing(progress);
                
                // Update properties
                for (const key in this.properties) {
                    const start = this._startValues[key];
                    const end = this.properties[key];
                    
                    if (typeof start === 'number') {
                        this.target[key] = start + (end - start) * easedProgress;
                    }
                }
                
                // Callback
                if (this.onUpdate) {
                    this.onUpdate(progress, easedProgress);
                }
                
                // Check if complete
                if (progress >= 1) {
                    this._running = false;
                    this._completed = true;
                    
                    if (this.onComplete) {
                        this.onComplete();
                    }
                    resolve();
                } else {
                    this._rafId = requestAnimationFrame(animate);
                }
            };
            
            this._rafId = requestAnimationFrame(animate);
        });
    }

    /**
     * Stop the animation
     */
    stop() {
        this._running = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    /**
     * Check if animation is complete
     * @returns {boolean}
     */
    isComplete() {
        return this._completed;
    }

    /**
     * Check if animation is running
     * @returns {boolean}
     */
    isRunning() {
        return this._running;
    }
}

// ==========================================
// ANIMATION TIMELINE
// ==========================================

/**
 * Timeline - sequence and parallel animations
 */
export class Timeline {
    constructor() {
        /** @type {Array<{tween: Tween, startTime: number}>} */
        this._tweens = [];
        /** @type {number} */
        this._duration = 0;
        /** @type {number} */
        this._currentTime = 0;
        /** @type {boolean} */
        this._running = false;
        /** @type {Function} */
        this._onComplete = null;
    }

    /**
     * Add tween at specific time
     * @param {Tween} tween 
     * @param {number} startTime - Start time in ms
     * @returns {this}
     */
    add(tween, startTime = 0) {
        this._tweens.push({ tween, startTime });
        this._duration = Math.max(this._duration, startTime + tween.duration + tween.delay);
        return this;
    }

    /**
     * Add tween after previous
     * @param {Tween} tween 
     * @param {number} gap - Gap after previous (can be negative for overlap)
     * @returns {this}
     */
    addAfter(tween, gap = 0) {
        const startTime = this._duration + gap;
        return this.add(tween, Math.max(0, startTime));
    }

    /**
     * Set completion callback
     * @param {Function} callback 
     * @returns {this}
     */
    onComplete(callback) {
        this._onComplete = callback;
        return this;
    }

    /**
     * Play the timeline
     * @returns {Promise<void>}
     */
    play() {
        return new Promise((resolve) => {
            this._running = true;
            this._currentTime = 0;
            
            const startTimestamp = performance.now();
            
            const animate = (timestamp) => {
                if (!this._running) {
                    resolve();
                    return;
                }
                
                this._currentTime = timestamp - startTimestamp;
                
                // Start tweens that should be playing
                for (const { tween, startTime } of this._tweens) {
                    if (this._currentTime >= startTime && !tween.isRunning() && !tween.isComplete()) {
                        tween.start();
                    }
                }
                
                // Check if all complete
                if (this._currentTime >= this._duration) {
                    this._running = false;
                    if (this._onComplete) {
                        this._onComplete();
                    }
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    /**
     * Stop the timeline
     */
    stop() {
        this._running = false;
        for (const { tween } of this._tweens) {
            tween.stop();
        }
    }

    /**
     * Reset the timeline
     */
    reset() {
        this.stop();
        this._currentTime = 0;
        // Reset all tweens to initial state
        for (const { tween } of this._tweens) {
            tween._completed = false;
        }
    }
}

// ==========================================
// CSS TRANSITION HELPERS
// ==========================================

/**
 * CSS Transition utilities
 */
export const Transition = {
    /**
     * Apply CSS transition to element
     * @param {HTMLElement} element 
     * @param {object} styles - CSS styles to animate to
     * @param {object} options - Transition options
     * @returns {Promise<void>}
     */
    to(element, styles, options = {}) {
        const duration = options.duration || 300;
        const easing = options.easing || 'ease-out';
        const properties = Object.keys(styles).join(', ');
        
        return new Promise((resolve) => {
            // Set transition
            element.style.transition = `${properties} ${duration}ms ${easing}`;
            
            // Apply styles
            Object.assign(element.style, styles);
            
            // Listen for transition end
            const onEnd = () => {
                element.removeEventListener('transitionend', onEnd);
                element.style.transition = '';
                resolve();
            };
            
            element.addEventListener('transitionend', onEnd);
            
            // Fallback timeout
            setTimeout(resolve, duration + 50);
        });
    },

    /**
     * Fade in element
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    fadeIn(element, duration = 200) {
        element.style.opacity = '0';
        element.style.display = '';
        
        // Force reflow to ensure opacity is set before transition starts
        element.offsetHeight;
        
        return Transition.to(element, { opacity: '1' }, { duration });
    },

    /**
     * Fade out element
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    async fadeOut(element, duration = 200) {
        await Transition.to(element, { opacity: '0' }, { duration });
        element.style.display = 'none';
    },

    /**
     * Slide down (expand)
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    slideDown(element, duration = 300) {
        element.style.display = '';
        const height = element.scrollHeight;
        element.style.height = '0';
        element.style.overflow = 'hidden';
        
        return Transition.to(element, { height: height + 'px' }, { duration }).then(() => {
            element.style.height = '';
            element.style.overflow = '';
        });
    },

    /**
     * Slide up (collapse)
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    async slideUp(element, duration = 300) {
        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        
        // Force reflow
        element.offsetHeight;
        
        await Transition.to(element, { height: '0' }, { duration });
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
    },

    /**
     * Scale in (pop)
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    scaleIn(element, duration = 200) {
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.display = '';
        
        return Transition.to(element, { 
            transform: 'scale(1)', 
            opacity: '1' 
        }, { duration, easing: 'ease-out' });
    },

    /**
     * Scale out
     * @param {HTMLElement} element 
     * @param {number} duration 
     * @returns {Promise<void>}
     */
    async scaleOut(element, duration = 200) {
        await Transition.to(element, { 
            transform: 'scale(0.8)', 
            opacity: '0' 
        }, { duration, easing: 'ease-in' });
        element.style.display = 'none';
        element.style.transform = '';
        element.style.opacity = '';
    }
};

// ==========================================
// SPRING ANIMATION
// ==========================================

/**
 * Spring physics animation
 */
export class Spring {
    /**
     * @param {object} options
     * @param {number} options.stiffness - Spring stiffness (default: 100)
     * @param {number} options.damping - Damping ratio (default: 10)
     * @param {number} options.mass - Mass (default: 1)
     */
    constructor(options = {}) {
        this.stiffness = options.stiffness || 100;
        this.damping = options.damping || 10;
        this.mass = options.mass || 1;
        this.precision = options.precision || 0.01;
        
        this._value = 0;
        this._target = 0;
        this._velocity = 0;
        this._running = false;
        this._rafId = null;
        this._onUpdate = null;
        this._onComplete = null;
    }

    /**
     * Set current value
     * @param {number} value 
     */
    setValue(value) {
        this._value = value;
    }

    /**
     * Get current value
     * @returns {number}
     */
    getValue() {
        return this._value;
    }

    /**
     * Animate to target
     * @param {number} target 
     * @param {Function} onUpdate 
     * @param {Function} onComplete 
     */
    to(target, onUpdate = null, onComplete = null) {
        this._target = target;
        this._onUpdate = onUpdate;
        this._onComplete = onComplete;
        
        if (!this._running) {
            this._running = true;
            this._lastTime = performance.now();
            this._animate();
        }
    }

    /**
     * Animation loop
     * @private
     */
    _animate() {
        if (!this._running) return;
        
        const now = performance.now();
        const dt = Math.min((now - this._lastTime) / 1000, 0.064); // Cap at ~15fps minimum
        this._lastTime = now;
        
        // Spring physics
        const displacement = this._target - this._value;
        const springForce = displacement * this.stiffness;
        const dampingForce = this._velocity * this.damping;
        const acceleration = (springForce - dampingForce) / this.mass;
        
        this._velocity += acceleration * dt;
        this._value += this._velocity * dt;
        
        // Update callback
        if (this._onUpdate) {
            this._onUpdate(this._value);
        }
        
        // Check if at rest
        if (Math.abs(this._velocity) < this.precision && 
            Math.abs(displacement) < this.precision) {
            this._value = this._target;
            this._velocity = 0;
            this._running = false;
            
            if (this._onUpdate) {
                this._onUpdate(this._value);
            }
            if (this._onComplete) {
                this._onComplete();
            }
            return;
        }
        
        this._rafId = requestAnimationFrame(() => this._animate());
    }

    /**
     * Stop animation
     */
    stop() {
        this._running = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
    }

    /**
     * Check if at rest
     * @returns {boolean}
     */
    isAtRest() {
        return !this._running;
    }
}

// ==========================================
// ANIMATION UTILITIES
// ==========================================

/**
 * Request animation frame with cancellation
 * @param {Function} callback 
 * @returns {Function} Cancel function
 */
export function animationLoop(callback) {
    let running = true;
    let lastTime = performance.now();
    
    function loop(timestamp) {
        if (!running) return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        callback(deltaTime, timestamp);
        requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);
    
    return () => { running = false; };
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>} Timestamp
 */
export function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for multiple frames
 * @param {number} count 
 * @returns {Promise<void>}
 */
export async function waitFrames(count) {
    for (let i = 0; i < count; i++) {
        await nextFrame();
    }
}

/**
 * Animate a value with callback
 * @param {number} from 
 * @param {number} to 
 * @param {number} duration 
 * @param {Function} callback 
 * @param {Function} easing 
 * @returns {Promise<void>}
 */
export function animate(from, to, duration, callback, easing = Easing.easeOutQuad) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        
        function update(timestamp) {
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            const value = from + (to - from) * easedProgress;
            callback(value, progress);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(update);
    });
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    Easing,
    Tween,
    Timeline,
    Transition,
    Spring,
    animationLoop,
    nextFrame,
    waitFrames,
    animate
};
