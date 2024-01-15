"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Database_instances, _Database_schemes, _Database_metricScheme, _Database_defaultScheme, _Database_config, _Database_readFake, _Database_findScheme;
Object.defineProperty(exports, "__esModule", { value: true });
const Collector_1 = __importDefault(require("./Collector"));
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const LayerStorage_1 = __importStar(require("./LayerStorage/LayerStorage"));
const MetricTree_1 = __importDefault(require("./MetricTree"));
const Typing_1 = __importDefault(require("./Typing"));
ErrorManager_1.default.register('Xz9N2yZUqBPE', 'VDB_DATABASE_SCHEME_NAME', 'Incorrect scheme name, please use simple names ([a-zA-Z0-9._])');
ErrorManager_1.default.register('m0d1bCLsROTL', 'VDB_DATABASE_SCHEME_PATTERN', 'Incorrect scheme pattern, please use simple names ([a-zA-Z0-9._])');
ErrorManager_1.default.register('ca4pisi99FGm', 'VDB_DATABASE_SCHEME_SAFE', 'Can`t delete default schema');
ErrorManager_1.default.register('l40bZm0fgNDZ', 'VDB_DATABASE_TREE_DISABLED', 'The feature is disabled you can enable it via config');
ErrorManager_1.default.register('DLLHsBKBTSlm', 'VDB_DATABASE_NOT_FOUND', 'Scheme not found');
ErrorManager_1.default.register('hnnBP04agbxO', 'VDB_DATABASE_SCHEME_DUBLICATE', 'Such a scheme already exists in the base');
class Database {
    constructor(conf = { metricTree: false }) {
        _Database_instances.add(this);
        this.Collector = new Collector_1.default();
        this.MetricTree = new MetricTree_1.default();
        _Database_schemes.set(this, []);
        _Database_metricScheme.set(this, {});
        _Database_defaultScheme.set(this, {
            name: 'default',
            pattern: '*',
            retentions: '5s:10m, 1m:2h, 15m:1d, 1h:1w, 6h:1mon, 1d:1y',
            patternActs: ['*'],
            size: 0,
            metrics: [],
            vStorage: null,
            tStorage: null
        });
        _Database_config.set(this, {
            metricTree: false
        });
        Object.assign(__classPrivateFieldGet(this, _Database_config, "f"), conf);
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
    scheme(name, pattern, retentions, vStorage = null, tStorage = null) {
        if (!Typing_1.default.isName(name))
            throw ErrorManager_1.default.make('VDB_DATABASE_SCHEME_NAME', { name });
        if (!Typing_1.default.isName(pattern))
            throw ErrorManager_1.default.make('VDB_DATABASE_SCHEME_PATTERN', { pattern });
        Interval_1.default.retentions(retentions); // Validation scheme create retentions
        LayerStorage_1.default.make(vStorage, LayerStorage_1.StorageTypes.Bit, 8);
        LayerStorage_1.default.make(tStorage, LayerStorage_1.StorageTypes.Bit, 8);
        for (const o of __classPrivateFieldGet(this, _Database_schemes, "f"))
            if (o.name === name)
                throw ErrorManager_1.default.make('VDB_DATABASE_SCHEME_DUBLICATE', { name });
        const nScheme = {
            name,
            pattern,
            retentions,
            patternActs: pattern.split('.'),
            size: 0,
            metrics: [],
            vStorage,
            tStorage
        };
        __classPrivateFieldGet(this, _Database_schemes, "f").push(nScheme);
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
    read(name, period, precision, func = 'last') {
        const p = Interval_1.default.period(period);
        return this.readCustomRange(name, p.start, p.end, precision, func);
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
    readCustomRange(name, start, end, precision, func = 'last') {
        if (typeof precision === 'number')
            precision = Interval_1.default.getIntervalOfFixedCount(start, end, precision);
        else
            precision = Interval_1.default.parseInterval(precision);
        if (this.Collector.has(name))
            return this.Collector.read(name, start, end, precision, func);
        return __classPrivateFieldGet(this, _Database_instances, "m", _Database_readFake).call(this, start, end, precision);
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
    write(name, value, time = 0, func = 'last') {
        if (!this.Collector.has(name)) {
            const scheme = __classPrivateFieldGet(this, _Database_instances, "m", _Database_findScheme).call(this, name);
            this.Collector.init(name, scheme.retentions, scheme.vStorage, scheme.tStorage);
            const sz = this.Collector.size(name);
            scheme.size += sz;
            scheme.metrics.push(name);
            __classPrivateFieldGet(this, _Database_metricScheme, "f")[name] = scheme;
            if (__classPrivateFieldGet(this, _Database_config, "f").metricTree)
                this.MetricTree.update(name);
        }
        this.Collector.write(name, value, time, func);
    }
    /**
     * Deletes the schema with all its metrics
     *
     * @param {string} name Scheme name
    */
    schemeDestroy(name) {
        if (name === 'default')
            throw ErrorManager_1.default.make('VDB_DATABASE_SCHEME_SAFE', { name });
        for (let i = 0; i < __classPrivateFieldGet(this, _Database_schemes, "f").length; i++) {
            if (__classPrivateFieldGet(this, _Database_schemes, "f")[i].name !== name)
                continue;
            for (const mn of __classPrivateFieldGet(this, _Database_schemes, "f")[i].metrics) {
                if (__classPrivateFieldGet(this, _Database_config, "f").metricTree)
                    this.MetricTree.destroy(mn);
                this.Collector.destroy(mn);
            }
            __classPrivateFieldGet(this, _Database_schemes, "f").splice(i, 1);
        }
        throw ErrorManager_1.default.make('VDB_DATABASE_NOT_FOUND', { name });
    }
    /**
     * Return metric list of scheme
     *
     * @param name Scheme name
    */
    schemeMetrics(name) {
        for (const o of __classPrivateFieldGet(this, _Database_schemes, "f"))
            if (o.name === name)
                return o.metrics.slice();
        throw ErrorManager_1.default.make('VDB_DATABASE_NOT_FOUND', { name });
    }
    /**
     * Checks the existence of a schema
     *
     * @param name Scheme name
    */
    schemeHas(name) {
        for (const o of __classPrivateFieldGet(this, _Database_schemes, "f"))
            if (o.name === name)
                return true;
        return false;
    }
    /**
     * Returns a list of available scheme names
     *
     * @returns {Array<string>} List of circuit names
    */
    schemeList() {
        const r = ['default'];
        for (const o of __classPrivateFieldGet(this, _Database_schemes, "f"))
            r.push(o.name);
        return r;
    }
    /**
     * Returns the size of the schema. If the scheme was not found, returns null
     *
     * @param {string} name Scheme name
     * @returns {number} Size in bytes or null if no schema found
    */
    schemeSize(name) {
        if (name === 'default')
            return __classPrivateFieldGet(this, _Database_defaultScheme, "f").size;
        for (const o of __classPrivateFieldGet(this, _Database_schemes, "f"))
            if (o.name === name)
                return o.size;
        throw ErrorManager_1.default.make('VDB_DATABASE_NOT_FOUND', { name });
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
    find(pattern) {
        if (!__classPrivateFieldGet(this, _Database_config, "f").metricTree)
            throw ErrorManager_1.default.make('VDB_DATABASE_TREE_DISABLED', {});
        return this.MetricTree.find(pattern);
    }
}
exports.default = Database;
_Database_schemes = new WeakMap(), _Database_metricScheme = new WeakMap(), _Database_defaultScheme = new WeakMap(), _Database_config = new WeakMap(), _Database_instances = new WeakSet(), _Database_readFake = function _Database_readFake(start, end, precision) {
    const iVls = Interval_1.default.getIntervals(start, end, precision);
    const result = { relevant: false, start, end, rows: [] };
    for (const iv of iVls)
        result.rows.push({ value: null, time: iv });
    return result;
}, _Database_findScheme = function _Database_findScheme(metricName) {
    const nActs = metricName.split('.');
    for (const scheme of __classPrivateFieldGet(this, _Database_schemes, "f")) {
        for (let i = 0; i <= scheme.patternActs.length; i++) {
            if (i === scheme.patternActs.length)
                return scheme;
            if (scheme.patternActs[i] === nActs[i] ||
                scheme.patternActs[i] === '*')
                continue;
            else
                break;
        }
    }
    return __classPrivateFieldGet(this, _Database_defaultScheme, "f");
};
