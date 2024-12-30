"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _MetricResult_last, _MetricResult_first, _MetricResult_max, _MetricResult_min, _MetricResult_avg, _MetricResult_sum;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAggregateFunctions = void 0;
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
ErrorManager_1.default.register('L0B9VGXqu6PB', 'VDB_METRIC_AGGREGATE_TYPE', 'Unknown aggregation type');
var EAggregateFunctions;
(function (EAggregateFunctions) {
    EAggregateFunctions["last"] = "last";
    EAggregateFunctions["first"] = "first";
    EAggregateFunctions["max"] = "max";
    EAggregateFunctions["min"] = "min";
    EAggregateFunctions["avg"] = "avg";
    EAggregateFunctions["sum"] = "sum";
})(EAggregateFunctions = exports.EAggregateFunctions || (exports.EAggregateFunctions = {}));
/**
 * Helper for processing the obtained results of metrics readings
*/
class MetricResult {
    static isAggregateFunc(func, useExcept = false) {
        if (EAggregateFunctions[func] !== undefined)
            return true;
        if (useExcept)
            throw ErrorManager_1.default.make(new Error, 'VDB_METRIC_AGGREGATE_TYPE', { func });
        return false;
    }
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
    static aggregate(data, func = 'last') {
        switch (func) {
            case 'last':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_last).call(MetricResult, data);
            case 'first':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_first).call(MetricResult, data);
            case 'max':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_max).call(MetricResult, data);
            case 'min':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_min).call(MetricResult, data);
            case 'avg':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_avg).call(MetricResult, data);
            case 'sum':
                return __classPrivateFieldGet(MetricResult, _a, "m", _MetricResult_sum).call(MetricResult, data);
            default:
                throw ErrorManager_1.default.make(new Error, 'VDB_METRIC_AGGREGATE_TYPE', { func });
        }
    }
}
exports.default = MetricResult;
_a = MetricResult, _MetricResult_last = function _MetricResult_last(data) {
    for (let k = data.rows.length; k > 0; k--) {
        const row = data.rows[k - 1];
        if (row.value !== null)
            return row.value;
    }
    return null;
}, _MetricResult_first = function _MetricResult_first(data) {
    for (let k = 0; k < data.rows.length; k++) {
        if (data.rows[k].value !== null)
            return data.rows[k].value;
    }
    return null;
}, _MetricResult_max = function _MetricResult_max(data) {
    let res = null;
    for (let k = 0; k < data.rows.length; k++) {
        const row = data.rows[k];
        if (row.value !== null && res === null)
            res = row.value;
        if (row.value !== null && res !== null) {
            if (row.value > res)
                res = row.value;
        }
    }
    return res;
}, _MetricResult_min = function _MetricResult_min(data) {
    let res = null;
    for (let k = 0; k < data.rows.length; k++) {
        const row = data.rows[k];
        if (row.value !== null && res === null)
            res = row.value;
        if (row.value !== null && res !== null) {
            if (row.value < res)
                res = row.value;
        }
    }
    return res;
}, _MetricResult_avg = function _MetricResult_avg(data) {
    let res = 0;
    let count = 0;
    for (let k = 0; k < data.rows.length; k++) {
        const row = data.rows[k];
        if (row.value !== null) {
            res += row.value;
            count++;
        }
    }
    if (count === 0)
        return null;
    return res / count;
}, _MetricResult_sum = function _MetricResult_sum(data) {
    let res = null;
    for (let k = 0; k < data.rows.length; k++) {
        const row = data.rows[k];
        if (row.value !== null && res === null) {
            res = row.value;
        }
        if (row.value !== null && res !== null) {
            res += row.value;
        }
    }
    return res;
};
