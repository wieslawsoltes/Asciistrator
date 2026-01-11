/**
 * Asciistrator - DOM Utilities
 * 
 * Helper functions for DOM manipulation and event handling.
 */

/**
 * Query selector shorthand
 * @param {string} selector 
 * @param {Element|Document} [context=document] 
 * @returns {Element|null}
 */
export function $(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector 
 * @param {Element|Document} [context=document] 
 * @returns {Element[]}
 */
export function $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
}

/**
 * Create an element with attributes and children
 * @param {string} tag - Tag name
 * @param {object} [attrs={}] - Attributes and properties
 * @param {...(Element|string)} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class' || key === 'className') {
            if (Array.isArray(value)) {
                element.classList.add(...value.filter(Boolean));
            } else if (value) {
                element.className = value;
            }
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'html') {
            element.innerHTML = value;
        } else if (key === 'text') {
            element.textContent = value;
        } else if (value !== null && value !== undefined) {
            element.setAttribute(key, value);
        }
    }
    
    for (const child of children) {
        if (child instanceof Node) {
            element.appendChild(child);
        } else if (child !== null && child !== undefined) {
            element.appendChild(document.createTextNode(String(child)));
        }
    }
    
    return element;
}

/**
 * Shorthand for createElement
 */
export const el = createElement;

/**
 * Create element from HTML string
 * @param {string} html 
 * @returns {Element}
 */
export function htmlToElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}

/**
 * Add event listener with automatic cleanup
 * @param {Element|Window|Document} target 
 * @param {string} event 
 * @param {Function} handler 
 * @param {object} [options] 
 * @returns {Function} - Cleanup function
 */
export function addEvent(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    return () => target.removeEventListener(event, handler, options);
}

/**
 * Add multiple event listeners
 * @param {Element} target 
 * @param {object} events - Event name to handler map
 * @param {object} [options] 
 * @returns {Function} - Cleanup function
 */
export function addEvents(target, events, options) {
    const cleanups = Object.entries(events).map(([event, handler]) => 
        addEvent(target, event, handler, options)
    );
    return () => cleanups.forEach(cleanup => cleanup());
}

/**
 * Delegate event handling
 * @param {Element} container 
 * @param {string} event 
 * @param {string} selector 
 * @param {Function} handler 
 * @returns {Function} - Cleanup function
 */
export function delegate(container, event, selector, handler) {
    const delegatedHandler = (e) => {
        const target = e.target.closest(selector);
        if (target && container.contains(target)) {
            handler.call(target, e, target);
        }
    };
    return addEvent(container, event, delegatedHandler);
}

/**
 * Wait for DOM ready
 * @returns {Promise<void>}
 */
export function domReady() {
    return new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve();
        }
    });
}

/**
 * Get computed style value
 * @param {Element} element 
 * @param {string} property 
 * @returns {string}
 */
export function getStyle(element, property) {
    return getComputedStyle(element).getPropertyValue(property);
}

/**
 * Set CSS custom property
 * @param {string} name 
 * @param {string} value 
 * @param {Element} [element=document.documentElement] 
 */
export function setCssVar(name, value, element = document.documentElement) {
    element.style.setProperty(name, value);
}

/**
 * Get CSS custom property
 * @param {string} name 
 * @param {Element} [element=document.documentElement] 
 * @returns {string}
 */
export function getCssVar(name, element = document.documentElement) {
    return getComputedStyle(element).getPropertyValue(name).trim();
}

/**
 * Toggle class on element
 * @param {Element} element 
 * @param {string} className 
 * @param {boolean} [force] 
 */
export function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}

/**
 * Show element
 * @param {Element} element 
 * @param {string} [display='block'] 
 */
export function show(element, display = 'block') {
    element.style.display = display;
}

/**
 * Hide element
 * @param {Element} element 
 */
export function hide(element) {
    element.style.display = 'none';
}

/**
 * Toggle element visibility
 * @param {Element} element 
 * @param {boolean} [visible] 
 */
export function toggle(element, visible) {
    const shouldShow = visible ?? element.style.display === 'none';
    element.style.display = shouldShow ? '' : 'none';
}

/**
 * Get element position relative to viewport
 * @param {Element} element 
 * @returns {{x: number, y: number, width: number, height: number}}
 */
export function getRect(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
}

/**
 * Get element position relative to document
 * @param {Element} element 
 * @returns {{x: number, y: number}}
 */
export function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
    };
}

/**
 * Get mouse position relative to element
 * @param {MouseEvent} event 
 * @param {Element} element 
 * @returns {{x: number, y: number}}
 */
export function getMousePos(event, element) {
    const rect = element.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/**
 * Request animation frame with cancellation
 * @param {Function} callback 
 * @returns {{cancel: Function}}
 */
export function raf(callback) {
    let id = requestAnimationFrame(function loop(time) {
        callback(time);
        id = requestAnimationFrame(loop);
    });
    return {
        cancel: () => cancelAnimationFrame(id)
    };
}

/**
 * Create a debounced function
 * @param {Function} fn 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Create a throttled function
 * @param {Function} fn 
 * @param {number} limit 
 * @returns {Function}
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Empty element contents
 * @param {Element} element 
 */
export function empty(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Replace element contents
 * @param {Element} element 
 * @param {...(Element|string)} content 
 */
export function setContent(element, ...content) {
    empty(element);
    for (const child of content) {
        if (child instanceof Node) {
            element.appendChild(child);
        } else if (child !== null && child !== undefined) {
            element.appendChild(document.createTextNode(String(child)));
        }
    }
}

/**
 * Set multiple attributes
 * @param {Element} element 
 * @param {object} attrs 
 */
export function setAttrs(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, value);
        }
    }
}

/**
 * Clone element (deep by default)
 * @param {Element} element 
 * @param {boolean} [deep=true] 
 * @returns {Element}
 */
export function clone(element, deep = true) {
    return element.cloneNode(deep);
}

/**
 * Insert element after reference
 * @param {Element} newElement 
 * @param {Element} reference 
 */
export function insertAfter(newElement, reference) {
    reference.parentNode.insertBefore(newElement, reference.nextSibling);
}

/**
 * Get sibling elements
 * @param {Element} element 
 * @returns {Element[]}
 */
export function siblings(element) {
    return [...element.parentNode.children].filter(child => child !== element);
}

/**
 * Get parent elements up to root
 * @param {Element} element 
 * @param {string} [until] - Stop at element matching selector
 * @returns {Element[]}
 */
export function parents(element, until) {
    const result = [];
    let parent = element.parentElement;
    while (parent) {
        if (until && parent.matches(until)) break;
        result.push(parent);
        parent = parent.parentElement;
    }
    return result;
}

/**
 * Check if element matches selector
 * @param {Element} element 
 * @param {string} selector 
 * @returns {boolean}
 */
export function matches(element, selector) {
    return element.matches(selector);
}

/**
 * Focus element with optional scroll
 * @param {Element} element 
 * @param {object} [options] 
 */
export function focus(element, options = {}) {
    element.focus(options);
}

/**
 * Scroll element into view
 * @param {Element} element 
 * @param {object} [options] 
 */
export function scrollIntoView(element, options = { behavior: 'smooth', block: 'nearest' }) {
    element.scrollIntoView(options);
}

export default {
    $,
    $$,
    createElement,
    el,
    htmlToElement,
    addEvent,
    addEvents,
    delegate,
    domReady,
    getStyle,
    setCssVar,
    getCssVar,
    toggleClass,
    show,
    hide,
    toggle,
    getRect,
    getOffset,
    getMousePos,
    raf,
    debounce,
    throttle,
    empty,
    setContent,
    setAttrs,
    clone,
    insertAfter,
    siblings,
    parents,
    matches,
    focus,
    scrollIntoView
};
