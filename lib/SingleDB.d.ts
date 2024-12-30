import Collector, { ICollectorOptions } from "./Collector";
import Interval from "./Interval";
import { IMetricReadResult } from "./Layer";
/**
 * Top-level class for managing metrics
 * Each metric in this class can have different settings than other metrics.
*/
export default class SingleDB {
    protected Collector: Collector;
    protected defaultMetric: {
        retentions: string;
        tStorage: null;
        vStorage: null;
        CInterval: typeof Interval;
    };
    /**
     * Add new metric with custom params
     *
     * @example
     *
     * Create metric with default options
     * use naming params (param `name` require)
     * ```ts
     * SingleTreeObject.metric({ name: 'metric.uid' })
     * ```
     *
     * Create metric with custom params
     *
     * ```ts
     * SingleTreeObject.metric({
     *      name: 'metric.uid',
     *      retentions:  '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
     *      tStorage: StorageTypes.Uint64
     * })
     * ```
     * @see ICollectorOptions
    */
    metric({ name, retentions, tStorage, vStorage, CInterval }: ICollectorOptions): void;
    /**
     * Reading metrics from the database. Uses a pass through all layers to get more complete and detailed information
     *
     * Example:
     *
     * ```
     * // Retrieving `test.name` metric data for the last 6 hours with an accuracy of 15 minutes
     * DB.read('test.name', 'now-6h:now', '15m')
     * ```
     *
     * You can use instead of an interval - the number of metrics you want to get for this period.
     *
     * In this case, by changing the period settings, you will always get a maximum of 300 metrics:
     *
     * ```
     * DB.read('test.name', 'now-6h:now', 300)
     * ```
     *
     * All types of intervals:
     *
     * - us - microseconds
     * - ms - milliseconds
     * - s - seconds
     * - m - minutes
     * - h - hours
     * - d - days
     * - w - weeks
     * - mon - months
     * - y - years
     *
     * If the metric does not exist, it will generate a correct IMetricReadResult response
     * but specifying the flag relevant: false
     *
     * Example of an answer:
     * ```ts
     * {
     *  relevant: true,
     *  start: 1,
     *  end: 3,
     *  rows: [1,2,3]
     * }
     * ```
     *
     * You can use the function to aggregate data in an interval,
     * the `last` function is used by default, which returns the last value in the interval.
     *
     * List of aggregation functions:
     *
     *  - **last** - Returns the last non `null` value
     *  - **first** - Returns the first non `null` value
     *  - **max** - Returns the maximum value, if there are no valid values - returns null
     *  - **min** - Returns the minimum value, if there are no valid values - returns null
     *  - **avg** - Returns the average value if all values are `null` - returns null
     *  - **sum** - Returns the sum of values, if all values are `null` - returns null
     *
     * @param {string} name Metric name
     * @param {string} period Period in the format 'now-6h:now' for details see /docs/Database.md
     * @param {string | number} precision Accuracy interval '15m', '5s', '1h' or count of metrics 10, 200, 1500
     * @param {string} func Data aggregation function @see MetricResult.aggregate
    */
    read(name: string, period: string, precision: string | number, func?: string): IMetricReadResult;
    /**
     * Reading metrics from the database using an arbitrary time period
     *
     * @see read
     * @param {string} name Metric name
     * @param {number} start Start of period (in seconds)
     * @param {number} end End of period (in seconds)
     * @param {string | number} precision Accuracy interval '15m', '5s', '1h' or count of metrics 10, 200, 1500
     * @param {string} func Data aggregation function @see MetricResult.aggregate
    */
    readCustomRange(name: string, start: number, end: number, precision: string | number, func?: string): IMetricReadResult;
    /**
     * Reads all data, from the beginning of the data record to the last record
     *
     * @param {string} name Metric name
     * @param {string | number} precision Accuracy interval '15m', '5s', '1h' or count of metrics 10, 200, 1500
     * @param {string} func Data aggregation function @see MetricResult.aggregate
    */
    readAll(name: string, precision: string | number, func?: string): IMetricReadResult;
    /**
     * Write metric data
     *
     * If the metric has not been initialized, it will be done automatically.
     *
     * By default, the data is written from now
     *
     * By default, the modifier last is used
     *
     * List of all modifiers:
     * - **last** - Permanently overwrites the metric index value
     * - **first** - Leaves the first metric value to be overwritten
     * - **max** - Overwrites the value if the new value is greater than the old one.
     * - **min** - Overwrites the value if the new value is less than the old value
     * - **avg** - Calculates the average value between the current value and the previous value.
     * - **sum** - Adds the current value to the past value
     *
     * @see scheme
     *
     * @param {string} name Metric name
     * @param {number} value Metric value
     * @param {number} time Time in MTU
     * @param {string} func Modification function
    */
    write(name: string, value: number, time?: number, func?: string): void;
    /**
     * Deletes the metric with all data
     *
     * @param {string} name Scheme name
    */
    destroy(name: string): void;
    /**
     * Returns the size of the metric
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    size(name: string): number;
    /**
     * Checks if the metric exists in the collection
     *
     * @param {string} name Metric name
     * @returns {boolean}
    */
    has(name: string): boolean;
    /**
     * Returns the estimated start of the metric graph
     *
     * @param {string} name The name of the metric
    */
    start(name: string): number;
    /**
     * Returns the estimated end of the metric graph
     *
     * @param {string} name The name of the metric
    */
    end(name: string): number;
    protected parsePrecission(start: number, end: number, precision: string | number, CInterval: typeof Interval): number;
    /**
     * Before write metric hook
     * @see write
    */
    protected beforeWrite(name: string, value: number, time?: number, func?: string): void;
    /**
     * After write metric hook
     * @see write
    */
    protected afterWrite(name: string, value: number, time?: number, func?: string): void;
    /**
     * Before destroy metric hook
     * @see write
    */
    protected beforeDestroy(name: string): void;
    /**
     * After destroy metric hook
     * @see write
    */
    protected afterDestroy(name: string): void;
}
