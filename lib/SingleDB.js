"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Collector_1 = __importDefault(require("./Collector"));
const Interval_1 = __importDefault(require("./Interval"));
/**
 * Top-level class for managing metrics
 * Each metric in this class can have different settings than other metrics.
*/
class SingleDB {
    constructor() {
        this.Collector = new Collector_1.default();
        this.defaultMetric = {
            retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
            tStorage: null,
            vStorage: null,
            CInterval: Interval_1.default
        };
    }
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
    metric({ name, retentions = this.defaultMetric.retentions, tStorage = this.defaultMetric.tStorage, vStorage = this.defaultMetric.vStorage, CInterval = this.defaultMetric.CInterval }) {
        this.Collector.init({ name, retentions, tStorage, vStorage, CInterval });
    }
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
    read(name, period, precision, func = 'last') {
        // Prepare readfake data
        const p = Interval_1.default.period(period);
        if (!this.Collector.has(name))
            return this.Collector.readFake(p.start, p.end, this.parsePrecission(p.start, p.end, precision, this.defaultMetric.CInterval));
        // Prepare real data
        const CInterval = this.Collector.interval(name);
        const ni = CInterval.period(period);
        return this.readCustomRange(name, ni.start, ni.end, precision, func);
    }
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
    readCustomRange(name, start, end, precision, func = 'last') {
        if (!this.Collector.has(name))
            return this.Collector.readFake(start, end, this.parsePrecission(start, end, precision, this.defaultMetric.CInterval));
        return this.Collector.read(name, start, end, this.parsePrecission(start, end, precision, this.Collector.interval(name)), func);
    }
    /**
     * Reads all data, from the beginning of the data record to the last record
     *
     * @param {string} name Metric name
     * @param {string | number} precision Accuracy interval '15m', '5s', '1h' or count of metrics 10, 200, 1500
     * @param {string} func Data aggregation function @see MetricResult.aggregate
    */
    readAll(name, precision, func = 'last') {
        if (!this.Collector.has(name))
            return this.Collector.readFake(Interval_1.default.now(), Interval_1.default.now(), 1);
        const start = this.Collector.start(name);
        const end = this.Collector.end(name);
        if (start === 0 || start > end)
            return this.Collector.readFake(start, start, 1);
        return this.readCustomRange(name, start, end, precision, func);
    }
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
    write(name, value, time = 0, func = 'last') {
        this.beforeWrite(name, value, time, func);
        this.Collector.write(name, value, time, func);
        this.afterWrite(name, value, time, func);
    }
    /**
     * Deletes the metric with all data
     *
     * @param {string} name Scheme name
    */
    destroy(name) {
        this.beforeDestroy(name);
        this.Collector.destroy(name);
        this.afterDestroy(name);
    }
    /**
     * Returns the size of the metric
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    size(name) {
        return this.Collector.size(name);
    }
    /**
     * Checks if the metric exists in the collection
     *
     * @param {string} name Metric name
     * @returns {boolean}
    */
    has(name) {
        return this.Collector.has(name);
    }
    /**
     * Returns the estimated start of the metric graph
     *
     * @param {string} name The name of the metric
    */
    start(name) {
        return this.Collector.start(name);
    }
    /**
     * Returns the estimated end of the metric graph
     *
     * @param {string} name The name of the metric
    */
    end(name) {
        return this.Collector.end(name);
    }
    parsePrecission(start, end, precision, CInterval) {
        if (typeof precision === 'number')
            return CInterval.getIntervalOfFixedCount(start, end, precision);
        return CInterval.parseInterval(precision);
    }
    /**
     * Before write metric hook
     * @see write
    */
    beforeWrite(name, value, time = 0, func = 'last') {
        if (!this.Collector.has(name)) {
            this.Collector.init(Object.assign({ name }, this.defaultMetric));
        }
    }
    /**
     * After write metric hook
     * @see write
    */
    afterWrite(name, value, time = 0, func = 'last') { return; }
    /**
     * Before destroy metric hook
     * @see write
    */
    beforeDestroy(name) { return; }
    /**
     * After destroy metric hook
     * @see write
    */
    afterDestroy(name) { return; }
}
exports.default = SingleDB;
