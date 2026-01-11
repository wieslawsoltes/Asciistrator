/**
 * Asciistrator - Charts Module Index
 * 
 * Main entry point for the charting engine.
 * Exports all chart types and utilities.
 */

// ==========================================
// EXPORTS
// ==========================================

// Base classes and utilities
export {
    Chart,
    DataPoint,
    DataSeries,
    ChartChars,
    ChartPalettes,
    formatNumber,
    generateTicks,
    lerp,
    mapRange
} from './base.js';

// Axis system
export {
    Axis,
    XAxis,
    YAxis,
    CategoryAxis,
    TimeAxis,
    LogAxis,
    AxisDefaults,
    createAxis
} from './axis.js';

// Legend, Tooltip, and Annotations
export {
    Legend,
    LegendItem,
    LegendPosition,
    Tooltip,
    Crosshair,
    Annotation
} from './legend.js';

// Bar charts
export {
    BarChart,
    ColumnChart,
    HorizontalBarChart,
    BarOrientation,
    BarMode,
    Sparkline,
    ProgressBar,
    createBarChart
} from './bar.js';

// Line and area charts
export {
    LineChart,
    AreaChart,
    StackedAreaChart,
    SparkLine,
    LineInterpolation,
    MarkerStyle,
    createLineChart
} from './line.js';

// Pie and donut charts
export {
    PieChart,
    DonutChart,
    GaugeChart,
    PieChars,
    LabelPosition,
    createPieChart,
    createDonutChart,
    createGaugeChart
} from './pie.js';

// Scatter and bubble charts
export {
    ScatterChart,
    BubbleChart,
    CorrelationPlot,
    ScatterMarker,
    TrendLineType,
    createScatterChart,
    createBubbleChart,
    createCorrelationPlot
} from './scatter.js';

// ==========================================
// CHART FACTORY
// ==========================================

/**
 * Chart type registry
 */
const ChartTypes = {
    bar: () => import('./bar.js').then(m => m.BarChart),
    column: () => import('./bar.js').then(m => m.ColumnChart),
    'horizontal-bar': () => import('./bar.js').then(m => m.HorizontalBarChart),
    line: () => import('./line.js').then(m => m.LineChart),
    area: () => import('./line.js').then(m => m.AreaChart),
    'stacked-area': () => import('./line.js').then(m => m.StackedAreaChart),
    pie: () => import('./pie.js').then(m => m.PieChart),
    donut: () => import('./pie.js').then(m => m.DonutChart),
    gauge: () => import('./pie.js').then(m => m.GaugeChart),
    scatter: () => import('./scatter.js').then(m => m.ScatterChart),
    bubble: () => import('./scatter.js').then(m => m.BubbleChart),
    correlation: () => import('./scatter.js').then(m => m.CorrelationPlot)
};

/**
 * Chart factory - create charts by type name
 */
export class ChartFactory {
    /**
     * Get available chart types
     * @returns {string[]}
     */
    static getTypes() {
        return Object.keys(ChartTypes);
    }
    
    /**
     * Create a chart by type
     * @param {string} type - Chart type name
     * @param {object} options - Chart options
     * @returns {Promise<Chart>}
     */
    static async create(type, options = {}) {
        const loader = ChartTypes[type];
        
        if (!loader) {
            throw new Error(`Unknown chart type: ${type}`);
        }
        
        const ChartClass = await loader();
        return new ChartClass(options);
    }
    
    /**
     * Create a chart synchronously (uses already-imported modules)
     * @param {string} type - Chart type name
     * @param {object} options - Chart options
     * @returns {Chart}
     */
    static createSync(type, options = {}) {
        switch (type) {
            case 'bar':
                return new BarChart(options);
            case 'column':
                return new ColumnChart(options);
            case 'horizontal-bar':
                return new HorizontalBarChart(options);
            case 'line':
                return new LineChart(options);
            case 'area':
                return new AreaChart(options);
            case 'stacked-area':
                return new StackedAreaChart(options);
            case 'pie':
                return new PieChart(options);
            case 'donut':
                return new DonutChart(options);
            case 'gauge':
                return new GaugeChart(options);
            case 'scatter':
                return new ScatterChart(options);
            case 'bubble':
                return new BubbleChart(options);
            case 'correlation':
                return new CorrelationPlot(options);
            default:
                throw new Error(`Unknown chart type: ${type}`);
        }
    }
}

// ==========================================
// CHART MANAGER
// ==========================================

/**
 * Manager for multiple charts in a document
 */
export class ChartManager {
    constructor() {
        this.charts = new Map();
        this.idCounter = 0;
    }
    
    /**
     * Add a chart
     * @param {Chart} chart - Chart instance
     * @param {string} id - Optional ID
     * @returns {string} Chart ID
     */
    add(chart, id = null) {
        const chartId = id ?? `chart_${++this.idCounter}`;
        this.charts.set(chartId, chart);
        return chartId;
    }
    
    /**
     * Get a chart by ID
     * @param {string} id - Chart ID
     * @returns {Chart|null}
     */
    get(id) {
        return this.charts.get(id) ?? null;
    }
    
    /**
     * Remove a chart
     * @param {string} id - Chart ID
     */
    remove(id) {
        this.charts.delete(id);
    }
    
    /**
     * Get all charts
     * @returns {Chart[]}
     */
    getAll() {
        return Array.from(this.charts.values());
    }
    
    /**
     * Clear all charts
     */
    clear() {
        this.charts.clear();
    }
    
    /**
     * Render all charts to a buffer
     * @param {AsciiBuffer} buffer - Target buffer
     */
    renderAll(buffer) {
        for (const chart of this.charts.values()) {
            const chartBuffer = chart.render();
            buffer.blit(chartBuffer, chart.x, chart.y);
        }
    }
}

// ==========================================
// QUICK CHART CREATION
// ==========================================

/**
 * Quick chart creation helpers
 */
export const QuickChart = {
    /**
     * Create a simple bar chart
     * @param {number[]} data - Data values
     * @param {string[]} labels - Category labels
     * @param {object} options - Additional options
     * @returns {BarChart}
     */
    bar(data, labels = [], options = {}) {
        const chart = new BarChart({ labels, ...options });
        chart.addSeries({ name: 'Data', data: data.map((y, i) => ({ x: i, y })) });
        return chart;
    },
    
    /**
     * Create a simple line chart
     * @param {number[]} data - Data values
     * @param {object} options - Additional options
     * @returns {LineChart}
     */
    line(data, options = {}) {
        const chart = new LineChart(options);
        chart.addSeries({ name: 'Data', data: data.map((y, i) => ({ x: i, y })) });
        return chart;
    },
    
    /**
     * Create a simple pie chart
     * @param {object} data - { label: value } object
     * @param {object} options - Additional options
     * @returns {PieChart}
     */
    pie(data, options = {}) {
        const labels = Object.keys(data);
        const values = Object.values(data);
        const chart = new PieChart({ labels, ...options });
        chart.addSeries({ 
            name: 'Data', 
            data: values.map((y, i) => ({ x: i, y, label: labels[i] })) 
        });
        return chart;
    },
    
    /**
     * Create a simple scatter chart
     * @param {Array<[number, number]>} points - Array of [x, y] pairs
     * @param {object} options - Additional options
     * @returns {ScatterChart}
     */
    scatter(points, options = {}) {
        const chart = new ScatterChart(options);
        chart.addSeries({ 
            name: 'Data', 
            data: points.map(([x, y]) => ({ x, y })) 
        });
        return chart;
    },
    
    /**
     * Create a sparkline string
     * @param {number[]} data - Data values
     * @returns {string}
     */
    sparkline(data) {
        return new SparkLine(data).toString();
    },
    
    /**
     * Create a progress bar string
     * @param {number} value - Progress value (0-100)
     * @param {number} width - Bar width
     * @returns {string}
     */
    progress(value, width = 20) {
        return new ProgressBar(value, { width }).toString();
    }
};

// ==========================================
// CHART TEMPLATES
// ==========================================

/**
 * Pre-configured chart templates
 */
export const ChartTemplates = {
    /**
     * Revenue comparison chart
     */
    revenue: (data, labels) => {
        return new BarChart({
            labels,
            title: { text: 'Revenue' },
            barStyle: { showValues: true },
            palette: ['█', '▓', '▒', '░']
        }).setData({ datasets: [{ name: 'Revenue', data }] });
    },
    
    /**
     * Time series chart
     */
    timeSeries: (data) => {
        return new LineChart({
            showMarkers: true,
            showArea: true,
            title: { text: 'Time Series' }
        }).setData({ datasets: [{ name: 'Values', data }] });
    },
    
    /**
     * Market share chart
     */
    marketShare: (data, labels) => {
        return new DonutChart({
            labels,
            title: { text: 'Market Share' },
            showPercentage: true
        }).setData({ datasets: [{ name: 'Share', data }] });
    },
    
    /**
     * Comparison dashboard (multiple small charts)
     */
    dashboard: (datasets) => {
        const charts = [];
        // Create multiple small charts
        // Implementation would depend on layout requirements
        return charts;
    }
};

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
    ChartFactory,
    ChartManager,
    QuickChart,
    ChartTemplates,
    
    // Re-export main classes
    Chart,
    BarChart,
    LineChart,
    PieChart,
    ScatterChart
};
