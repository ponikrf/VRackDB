import { IMetricReadResult } from "./Layer";
export declare enum EAggregateFunctions {
    last = "last",
    first = "first",
    max = "max",
    min = "min",
    avg = "avg",
    sum = "sum"
}
/**
 * Helper for processing the obtained results of metrics readings
*/
export default class MetricResult {
    #private;
    static isAggregateFunc(func: string, useExcept?: boolean): boolean;
    /**
     * Aggregation of metrics reading result
     *
     * The following aggregation types are currently supported:
     *
     * - **last** - Returns the last non `null` value
     * - **first** - Returns the first non `null` value
     * - **max** - Returns the maximum value, if there are no valid values - returns null
     * - **min** - Returns the minimum value if there are no valid values - returns null
     * - **avg** - Returns average value if all values are `null` - returns null
     * - **sum** - Returns the sum of values if all values are `null` - returns null
     *
     * @param {IMetricReadResult} data Data for aggregation
     * @param {string} func aggregation function
     */
    static aggregate(data: IMetricReadResult, func?: string): number | null;
}
