/**
 * Asciistrator - Test Framework
 * 
 * Lightweight test runner for browser-based testing.
 * No dependencies required.
 */

// ==========================================
// TEST FRAMEWORK CORE
// ==========================================

/**
 * Test result status
 */
export const TestStatus = {
    PASS: 'pass',
    FAIL: 'fail',
    SKIP: 'skip',
    ERROR: 'error'
};

/**
 * Assertion error
 */
export class AssertionError extends Error {
    constructor(message, expected, actual) {
        super(message);
        this.name = 'AssertionError';
        this.expected = expected;
        this.actual = actual;
    }
}

/**
 * Assertion utilities
 */
export const assert = {
    /**
     * Assert truthy value
     */
    ok(value, message = 'Expected truthy value') {
        if (!value) {
            throw new AssertionError(message, true, value);
        }
    },

    /**
     * Assert strict equality
     */
    equal(actual, expected, message) {
        if (actual !== expected) {
            throw new AssertionError(
                message || `Expected ${expected}, got ${actual}`,
                expected,
                actual
            );
        }
    },

    /**
     * Assert strict inequality
     */
    notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new AssertionError(
                message || `Expected not ${expected}`,
                `not ${expected}`,
                actual
            );
        }
    },

    /**
     * Assert deep equality
     */
    deepEqual(actual, expected, message) {
        if (!deepEquals(actual, expected)) {
            throw new AssertionError(
                message || 'Objects are not deeply equal',
                expected,
                actual
            );
        }
    },

    /**
     * Assert value is approximately equal (for floats)
     */
    approximately(actual, expected, tolerance = 0.0001, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new AssertionError(
                message || `Expected ${expected} ± ${tolerance}, got ${actual}`,
                expected,
                actual
            );
        }
    },

    /**
     * Assert throws error
     */
    throws(fn, expectedError, message) {
        let threw = false;
        let error = null;
        
        try {
            fn();
        } catch (e) {
            threw = true;
            error = e;
        }
        
        if (!threw) {
            throw new AssertionError(
                message || 'Expected function to throw',
                'an error',
                'no error'
            );
        }
        
        if (expectedError && !(error instanceof expectedError)) {
            throw new AssertionError(
                message || `Expected ${expectedError.name}, got ${error.name}`,
                expectedError.name,
                error.name
            );
        }
    },

    /**
     * Assert does not throw
     */
    doesNotThrow(fn, message) {
        try {
            fn();
        } catch (e) {
            throw new AssertionError(
                message || `Expected no error, got ${e.message}`,
                'no error',
                e.message
            );
        }
    },

    /**
     * Assert instanceof
     */
    instanceOf(value, constructor, message) {
        if (!(value instanceof constructor)) {
            throw new AssertionError(
                message || `Expected instance of ${constructor.name}`,
                constructor.name,
                typeof value
            );
        }
    },

    /**
     * Assert type
     */
    typeOf(value, type, message) {
        const actual = typeof value;
        if (actual !== type) {
            throw new AssertionError(
                message || `Expected type ${type}, got ${actual}`,
                type,
                actual
            );
        }
    },

    /**
     * Assert array includes value
     */
    includes(array, value, message) {
        if (!array.includes(value)) {
            throw new AssertionError(
                message || `Expected array to include ${value}`,
                value,
                array
            );
        }
    },

    /**
     * Assert array length
     */
    lengthOf(array, length, message) {
        if (array.length !== length) {
            throw new AssertionError(
                message || `Expected length ${length}, got ${array.length}`,
                length,
                array.length
            );
        }
    },

    /**
     * Assert object has property
     */
    hasProperty(obj, prop, message) {
        if (!(prop in obj)) {
            throw new AssertionError(
                message || `Expected object to have property ${prop}`,
                prop,
                Object.keys(obj)
            );
        }
    },

    /**
     * Assert greater than
     */
    greaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new AssertionError(
                message || `Expected ${actual} > ${expected}`,
                `> ${expected}`,
                actual
            );
        }
    },

    /**
     * Assert less than
     */
    lessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new AssertionError(
                message || `Expected ${actual} < ${expected}`,
                `< ${expected}`,
                actual
            );
        }
    },

    /**
     * Assert null
     */
    isNull(value, message) {
        if (value !== null) {
            throw new AssertionError(
                message || 'Expected null',
                null,
                value
            );
        }
    },

    /**
     * Assert not null
     */
    isNotNull(value, message) {
        if (value === null) {
            throw new AssertionError(
                message || 'Expected not null',
                'not null',
                null
            );
        }
    },

    /**
     * Assert undefined
     */
    isUndefined(value, message) {
        if (value !== undefined) {
            throw new AssertionError(
                message || 'Expected undefined',
                undefined,
                value
            );
        }
    },

    /**
     * Assert defined
     */
    isDefined(value, message) {
        if (value === undefined) {
            throw new AssertionError(
                message || 'Expected defined value',
                'defined',
                undefined
            );
        }
    },

    /**
     * Fail unconditionally
     */
    fail(message = 'Test failed') {
        throw new AssertionError(message);
    }
};

/**
 * Deep equality check
 */
function deepEquals(a, b) {
    if (a === b) return true;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object' || a === null || b === null) {
        return a === b;
    }
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((val, i) => deepEquals(val, b[i]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEquals(a[key], b[key]));
}

// ==========================================
// TEST SUITE
// ==========================================

/**
 * Test case
 */
class TestCase {
    constructor(name, fn, options = {}) {
        this.name = name;
        this.fn = fn;
        this.skip = options.skip || false;
        this.only = options.only || false;
        this.timeout = options.timeout || 5000;
        this.status = null;
        this.error = null;
        this.duration = 0;
    }

    async run() {
        if (this.skip) {
            this.status = TestStatus.SKIP;
            return;
        }

        const start = performance.now();

        try {
            const result = this.fn();
            if (result instanceof Promise) {
                await Promise.race([
                    result,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), this.timeout)
                    )
                ]);
            }
            this.status = TestStatus.PASS;
        } catch (error) {
            if (error instanceof AssertionError) {
                this.status = TestStatus.FAIL;
            } else {
                this.status = TestStatus.ERROR;
            }
            this.error = error;
        }

        this.duration = performance.now() - start;
    }
}

/**
 * Test suite
 */
class TestSuite {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.beforeEach = null;
        this.afterEach = null;
        this.beforeAll = null;
        this.afterAll = null;
    }

    addTest(test) {
        this.tests.push(test);
    }

    async run() {
        const results = {
            name: this.name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: 0,
            duration: 0
        };

        const start = performance.now();

        // Run beforeAll
        if (this.beforeAll) {
            try {
                await this.beforeAll();
            } catch (error) {
                console.error(`beforeAll failed in ${this.name}:`, error);
            }
        }

        // Check for .only tests
        const hasOnly = this.tests.some(t => t.only);
        const testsToRun = hasOnly ? this.tests.filter(t => t.only) : this.tests;

        for (const test of this.tests) {
            // Skip tests not in the run list (when using .only)
            if (hasOnly && !test.only) {
                test.status = TestStatus.SKIP;
                results.skipped++;
                results.tests.push({
                    name: test.name,
                    status: test.status,
                    duration: 0
                });
                continue;
            }

            // Run beforeEach
            if (this.beforeEach && !test.skip) {
                try {
                    await this.beforeEach();
                } catch (error) {
                    console.error(`beforeEach failed:`, error);
                }
            }

            // Run test
            await test.run();

            // Run afterEach
            if (this.afterEach && !test.skip) {
                try {
                    await this.afterEach();
                } catch (error) {
                    console.error(`afterEach failed:`, error);
                }
            }

            // Record result
            results.tests.push({
                name: test.name,
                status: test.status,
                duration: test.duration,
                error: test.error
            });

            // Update counters
            switch (test.status) {
                case TestStatus.PASS: results.passed++; break;
                case TestStatus.FAIL: results.failed++; break;
                case TestStatus.SKIP: results.skipped++; break;
                case TestStatus.ERROR: results.errors++; break;
            }
        }

        // Run afterAll
        if (this.afterAll) {
            try {
                await this.afterAll();
            } catch (error) {
                console.error(`afterAll failed in ${this.name}:`, error);
            }
        }

        results.duration = performance.now() - start;
        return results;
    }
}

// ==========================================
// TEST RUNNER
// ==========================================

/**
 * Test runner
 */
export class TestRunner {
    constructor() {
        this.suites = [];
        this.currentSuite = null;
        this.results = [];
    }

    /**
     * Create test suite
     */
    describe(name, fn) {
        const suite = new TestSuite(name);
        const prevSuite = this.currentSuite;
        
        this.currentSuite = suite;
        fn();
        this.currentSuite = prevSuite;
        
        this.suites.push(suite);
        return suite;
    }

    /**
     * Create test case
     */
    it(name, fn, options = {}) {
        if (!this.currentSuite) {
            throw new Error('it() must be called inside describe()');
        }
        this.currentSuite.addTest(new TestCase(name, fn, options));
    }

    /**
     * Skip test
     */
    skip(name, fn) {
        this.it(name, fn, { skip: true });
    }

    /**
     * Only run this test
     */
    only(name, fn) {
        this.it(name, fn, { only: true });
    }

    /**
     * Before each test
     */
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = fn;
        }
    }

    /**
     * After each test
     */
    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = fn;
        }
    }

    /**
     * Before all tests in suite
     */
    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = fn;
        }
    }

    /**
     * After all tests in suite
     */
    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = fn;
        }
    }

    /**
     * Run all tests
     */
    async run() {
        this.results = [];
        
        for (const suite of this.suites) {
            const result = await suite.run();
            this.results.push(result);
        }

        return this.results;
    }

    /**
     * Get summary
     */
    getSummary() {
        const summary = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: 0,
            duration: 0
        };

        for (const result of this.results) {
            summary.total += result.tests.length;
            summary.passed += result.passed;
            summary.failed += result.failed;
            summary.skipped += result.skipped;
            summary.errors += result.errors;
            summary.duration += result.duration;
        }

        return summary;
    }

    /**
     * Reset runner
     */
    reset() {
        this.suites = [];
        this.currentSuite = null;
        this.results = [];
    }
}

// ==========================================
// TEST REPORTER
// ==========================================

/**
 * Console reporter
 */
export class ConsoleReporter {
    constructor(options = {}) {
        this.verbose = options.verbose || false;
    }

    report(results) {
        console.group('Test Results');
        
        for (const suite of results) {
            this.reportSuite(suite);
        }

        this.reportSummary(results);
        console.groupEnd();
    }

    reportSuite(suite) {
        console.group(`📁 ${suite.name}`);
        
        for (const test of suite.tests) {
            this.reportTest(test);
        }

        console.log(`⏱️ ${suite.duration.toFixed(2)}ms`);
        console.groupEnd();
    }

    reportTest(test) {
        const icons = {
            [TestStatus.PASS]: '✅',
            [TestStatus.FAIL]: '❌',
            [TestStatus.SKIP]: '⏭️',
            [TestStatus.ERROR]: '💥'
        };

        const icon = icons[test.status];
        const time = this.verbose ? ` (${test.duration.toFixed(2)}ms)` : '';
        
        console.log(`${icon} ${test.name}${time}`);

        if (test.error && (test.status === TestStatus.FAIL || test.status === TestStatus.ERROR)) {
            console.error(`   ${test.error.message}`);
            if (test.error.expected !== undefined) {
                console.log(`   Expected: ${JSON.stringify(test.error.expected)}`);
                console.log(`   Actual: ${JSON.stringify(test.error.actual)}`);
            }
        }
    }

    reportSummary(results) {
        let total = 0, passed = 0, failed = 0, skipped = 0, errors = 0, duration = 0;

        for (const suite of results) {
            total += suite.tests.length;
            passed += suite.passed;
            failed += suite.failed;
            skipped += suite.skipped;
            errors += suite.errors;
            duration += suite.duration;
        }

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Total: ${total} | ✅ ${passed} | ❌ ${failed} | ⏭️ ${skipped} | 💥 ${errors}`);
        console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (failed === 0 && errors === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('😢 Some tests failed');
        }
    }
}

/**
 * HTML reporter
 */
export class HTMLReporter {
    constructor(container) {
        this.container = container || document.body;
    }

    report(results) {
        const html = this.generateHTML(results);
        this.container.innerHTML = html;
    }

    generateHTML(results) {
        let total = 0, passed = 0, failed = 0, skipped = 0, errors = 0, duration = 0;

        for (const suite of results) {
            total += suite.tests.length;
            passed += suite.passed;
            failed += suite.failed;
            skipped += suite.skipped;
            errors += suite.errors;
            duration += suite.duration;
        }

        const status = failed === 0 && errors === 0 ? 'passed' : 'failed';

        return `
            <div class="test-report ${status}">
                <style>
                    .test-report { font-family: system-ui, sans-serif; padding: 20px; }
                    .test-summary { 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin-bottom: 20px;
                    }
                    .test-summary.passed { background: #d4edda; color: #155724; }
                    .test-summary.failed { background: #f8d7da; color: #721c24; }
                    .test-suite { margin-bottom: 15px; }
                    .suite-name { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; }
                    .test-case { padding: 5px 0; padding-left: 20px; }
                    .test-case.pass { color: #28a745; }
                    .test-case.fail { color: #dc3545; }
                    .test-case.skip { color: #6c757d; }
                    .test-case.error { color: #dc3545; }
                    .test-error { 
                        background: #fff3cd; 
                        padding: 10px; 
                        margin: 5px 0 5px 20px;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 12px;
                    }
                </style>
                
                <div class="test-summary ${status}">
                    <h2>Test Results</h2>
                    <p>
                        Total: ${total} | 
                        Passed: ${passed} | 
                        Failed: ${failed} | 
                        Skipped: ${skipped} | 
                        Errors: ${errors}
                    </p>
                    <p>Duration: ${duration.toFixed(2)}ms</p>
                </div>
                
                ${results.map(suite => this.generateSuiteHTML(suite)).join('')}
            </div>
        `;
    }

    generateSuiteHTML(suite) {
        return `
            <div class="test-suite">
                <div class="suite-name">📁 ${suite.name}</div>
                ${suite.tests.map(test => this.generateTestHTML(test)).join('')}
            </div>
        `;
    }

    generateTestHTML(test) {
        const icons = {
            pass: '✅',
            fail: '❌',
            skip: '⏭️',
            error: '💥'
        };

        let errorHTML = '';
        if (test.error) {
            errorHTML = `
                <div class="test-error">
                    ${test.error.message}
                    ${test.error.expected !== undefined ? `<br>Expected: ${JSON.stringify(test.error.expected)}` : ''}
                    ${test.error.actual !== undefined ? `<br>Actual: ${JSON.stringify(test.error.actual)}` : ''}
                </div>
            `;
        }

        return `
            <div class="test-case ${test.status}">
                ${icons[test.status]} ${test.name} (${test.duration.toFixed(2)}ms)
                ${errorHTML}
            </div>
        `;
    }
}

// ==========================================
// GLOBAL INSTANCE & HELPERS
// ==========================================

export const runner = new TestRunner();

export const describe = (name, fn) => runner.describe(name, fn);
export const it = (name, fn, options) => runner.it(name, fn, options);
export const test = it; // Alias
export const beforeEach = (fn) => runner.beforeEach(fn);
export const afterEach = (fn) => runner.afterEach(fn);
export const beforeAll = (fn) => runner.beforeAll(fn);
export const afterAll = (fn) => runner.afterAll(fn);

// Skip and only helpers
it.skip = (name, fn) => runner.skip(name, fn);
it.only = (name, fn) => runner.only(name, fn);
test.skip = it.skip;
test.only = it.only;

/**
 * Run all tests and report results
 */
export async function runTests(options = {}) {
    const results = await runner.run();
    
    if (options.reporter === 'html') {
        const reporter = new HTMLReporter(options.container);
        reporter.report(results);
    } else {
        const reporter = new ConsoleReporter({ verbose: options.verbose });
        reporter.report(results);
    }
    
    return results;
}

export default {
    TestRunner,
    TestStatus,
    AssertionError,
    assert,
    describe,
    it,
    test,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    runTests,
    ConsoleReporter,
    HTMLReporter,
    runner
};
