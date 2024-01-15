import Collector from "./Collector";
import { IMetricReadResult } from "./Layer";
import { StorageTypes } from "./LayerStorage/LayerStorage";
import MetricTree from "./MetricTree";
interface IInputConfig {
    metricTree?: boolean;
}
export default class Database {
    #private;
    Collector: Collector;
    MetricTree: MetricTree;
    constructor(conf?: IInputConfig);
    /**
     * Adding a new scheme
     *
     * Example:
     * ```ts
     * // Creates a schema with the name `test` and the pattern 'test.name'
     * // Then the parameters are specified in the line separated by commas
     * // accuracy and storage time of metrics for a given scheme
     * // (with an accuracy of 5 seconds storage period of 10 minutes)
     * // (with an accuracy of 1 minute storage period of 2 hours)
     * DB.scheme('test', 'test.name', '5s:10m, 1m:2h')
     * ```
     *
     * Schemes are needed to assign different storage layer sizes to a single metric.
     * The combination of the different layers determines how accurately
     * and how long the data of a given metric will be stored.
     *
     * Schemas are assigned via a pattern if the metric fits the pattern of the schema,
     * it will be assigned to the layers specified in the pattern.
     *
     * Read More: @see /docs/Database
     *
     * @param {string} name Schema name, allocates metrics to a named group
     * @param {string} pattern Pattern scheme for metrics
     * @param {string} retentions Specifying the accuracy and size of the metric retention period.
     * @param {StorageTypes | null} vStorage Type of value storage
     * @param {StorageTypes | null} tStorage Type of time storage
    */
    scheme(name: string, pattern: string, retentions: string, vStorage?: StorageTypes | null, tStorage?: StorageTypes | null): void;
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
     * @param {string | number} precision Precision (interval like 2s, 5m, etc.)
    */
    readCustomRange(name: string, start: number, end: number, precision: string | number, func?: string): IMetricReadResult;
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
     * @param {number} time Optional metric time parameter
     * @param {string} func Modification function
    */
    write(name: string, value: number, time?: number, func?: string): void;
    /**
     * Deletes the schema with all its metrics
     *
     * @param {string} name Scheme name
    */
    schemeDestroy(name: string): void;
    /**
     * Return metric list of scheme
     *
     * @param name Scheme name
    */
    schemeMetrics(name: string): Array<string>;
    /**
     * Checks the existence of a schema
     *
     * @param name Scheme name
    */
    schemeHas(name: string): boolean;
    /**
     * Returns a list of available scheme names
     *
     * @returns {Array<string>} List of circuit names
    */
    schemeList(): Array<string>;
    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name: string): number;
    /**
     * Method of metrics search by template
     *
     * For searching, you can use the `*` symbol to retrieve all metrics in the list
     * note `test.list.*`.
     *
     * **It is not recommended to use the `*` character not at the end of a query string**
     *
     * Example:
     *
     * ```ts
     * [{
     *      leaf: true, // Whether the path is a destination path (false if the path is a list)
     *      name: 'name', // Act name
     *      path: 'test.name', // Full path
     * }]
     * ```
     *
     * @see MetricTree.find()
     * @param {string} pattern A search string of type `path.to.metric.*`.
    */
    find(pattern: string): import("./MetricTree").ITreeResultElement[];
}
export {};
