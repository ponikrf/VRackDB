/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import Collector from "./Collector";
import ErrorManager from "./Errors/ErrorManager";
import Interval from "./Interval";
import { IMetricReadResult } from "./Layer";
import LayerStorage, { StorageTypes } from "./LayerStorage/LayerStorage";
import MetricTree from "./MetricTree";
import Typing from "./Typing";

interface IConfig {
    metricTree: boolean
}

interface IInputConfig {
    metricTree?: boolean
}

interface IDatabaseScheme {
    name: string,
    pattern: string,
    retentions: string,
    patternActs: Array<string>,
    size: number,
    metrics: Array<string>,
    tStorage: StorageTypes | null,
    vStorage: StorageTypes | null
}

ErrorManager.register('Xz9N2yZUqBPE', 'VDB_DATABASE_SCHEME_NAME', 'Incorrect scheme name, please use simple names ([a-zA-Z0-9._])')
ErrorManager.register('m0d1bCLsROTL', 'VDB_DATABASE_SCHEME_PATTERN', 'Incorrect scheme pattern, please use simple names ([a-zA-Z0-9._])')
ErrorManager.register('ca4pisi99FGm', 'VDB_DATABASE_SCHEME_SAFE', 'Can`t delete default schema')
ErrorManager.register('l40bZm0fgNDZ', 'VDB_DATABASE_TREE_DISABLED', 'The feature is disabled you can enable it via config')
ErrorManager.register('DLLHsBKBTSlm', 'VDB_DATABASE_NOT_FOUND', 'Scheme not found')
ErrorManager.register('hnnBP04agbxO', 'VDB_DATABASE_SCHEME_DUBLICATE', 'Such a scheme already exists in the base')

export default class Database {
    Collector = new Collector();
    MetricTree = new MetricTree()
    #schemes: Array<IDatabaseScheme> = []
    #metricScheme: { [index: string]: IDatabaseScheme; } = {}
    #defaultScheme: IDatabaseScheme = {
        name: 'default',
        pattern: '*',
        retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
        patternActs: ['*'],
        size: 0,
        metrics: [],
        vStorage: null,
        tStorage: null
    }

    #config: IConfig = {
        metricTree: false
    }


    constructor(conf: IInputConfig = { metricTree: false }) {
        Object.assign(this.#config, conf)
    }

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
    scheme(name: string, pattern: string, retentions: string, vStorage: StorageTypes | null = null, tStorage: StorageTypes | null = null) {
        if (!Typing.isName(name)) throw ErrorManager.make('VDB_DATABASE_SCHEME_NAME',{ name })
        if (!Typing.isName(pattern)) throw ErrorManager.make('VDB_DATABASE_SCHEME_PATTERN',{ pattern })
        Interval.retentions(retentions) // Validation scheme create retentions
        LayerStorage.make(vStorage, StorageTypes.Bit, 8)
        LayerStorage.make(tStorage, StorageTypes.Bit, 8)
        for (const o of this.#schemes) if (o.name === name) throw ErrorManager.make('VDB_DATABASE_SCHEME_DUBLICATE', {name})
        const nScheme: IDatabaseScheme = {
            name,
            pattern,
            retentions,
            patternActs: pattern.split('.'),
            size: 0,
            metrics: [],
            vStorage,
            tStorage
        }
        this.#schemes.push(nScheme)
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
    read(name: string, period: string, precision: string | number, func = 'last'): IMetricReadResult {
        const p = Interval.period(period)
        return this.readCustomRange(name, p.start, p.end, precision, func)
    }

    /**
     * Reading metrics from the database using an arbitrary time period
     * 
     * @see read
     * @param {string} name Metric name
     * @param {number} start Start of period (in seconds)
     * @param {number} end End of period (in seconds)
     * @param {string | number} precision Precision (interval like 2s, 5m, etc.)
    */
    readCustomRange(name: string, start: number, end: number, precision: string | number, func = 'last'): IMetricReadResult {
        if (typeof precision === 'number') precision = Interval.getIntervalOfFixedCount(start, end, precision)
        else precision = Interval.parseInterval(precision)
        if (this.Collector.has(name)) return this.Collector.read(name, start, end, precision, func)
        return this.#readFake(start, end, precision)
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
     * @param {number} time Optional metric time parameter
     * @param {string} func Modification function
    */
    write(name: string, value: number, time = 0, func = 'last') {
        if (!this.Collector.has(name)) {
            const scheme = this.#findScheme(name)
            this.Collector.init(name, scheme.retentions, scheme.vStorage, scheme.tStorage)
            const sz = this.Collector.size(name)
            scheme.size += sz
            scheme.metrics.push(name)
            this.#metricScheme[name] = scheme
            if (this.#config.metricTree) this.MetricTree.update(name)
        }
        this.Collector.write(name, value, time, func)
    }

    /**
     * Deletes the schema with all its metrics
     * 
     * @param {string} name Scheme name
    */
    schemeDestroy(name: string) {
        if (name === 'default') throw ErrorManager.make('VDB_DATABASE_SCHEME_SAFE', { name })
        for (let i = 0; i < this.#schemes.length; i++) {
            if (this.#schemes[i].name !== name) continue
            for (const mn of this.#schemes[i].metrics) {
                if (this.#config.metricTree) this.MetricTree.destroy(mn)
                this.Collector.destroy(mn)
            }
            this.#schemes.splice(i, 1)
        }
        throw ErrorManager.make('VDB_DATABASE_NOT_FOUND', { name })
    }

    /**
     * Return metric list of scheme
     * 
     * @param name Scheme name
    */
    schemeMetrics(name: string): Array<string>{
        for (const o of this.#schemes) if (o.name === name) return o.metrics.slice()
        throw ErrorManager.make('VDB_DATABASE_NOT_FOUND', { name })
    }

    /**
     * Checks the existence of a schema
     * 
     * @param name Scheme name
    */
    schemeHas(name: string): boolean{
        for (const o of this.#schemes) if (o.name === name) return true
        return false
    }    

    /**
     * Returns a list of available scheme names
     * 
     * @returns {Array<string>} List of circuit names
    */
    schemeList(): Array<string> {
        const r: Array<string> = ['default']
        for (const o of this.#schemes) r.push(o.name); 
        return r
    }

    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     * 
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name: string): number {
        if (name === 'default') return this.#defaultScheme.size
        for (const o of this.#schemes) if (o.name === name) return o.size 
        throw ErrorManager.make('VDB_DATABASE_NOT_FOUND', { name })
    }


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
    find(pattern: string) {
        if (!this.#config.metricTree) throw ErrorManager.make('VDB_DATABASE_TREE_DISABLED', {})
        return this.MetricTree.find(pattern)
    }

    /**
     * Returns irrelevant data, used when the requested metric does not exist @see read
     * 
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision in seconds
    */
    #readFake(start: number, end: number, precision: number): IMetricReadResult {
        const iVls = Interval.getIntervals(start, end, precision)
        const result: IMetricReadResult = { relevant: false, start, end, rows: [] }
        for (const iv of iVls) result.rows.push({ value: null, time: iv })
        return result
    }

    /**
     * Looking for the right scheme for the metric.
     * 
     * @param {string} metricName Metric name
    */
    #findScheme(metricName: string): IDatabaseScheme {
        const nActs = metricName.split('.')
        for (const scheme of this.#schemes) {
            for (let i = 0; i <= scheme.patternActs.length; i++) {
                if (i === scheme.patternActs.length) return scheme
                if (scheme.patternActs[i] === nActs[i] ||
                    scheme.patternActs[i] === '*'
                ) continue; else break;
            }
        }
        return this.#defaultScheme
    }

}
