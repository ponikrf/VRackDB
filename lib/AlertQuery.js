"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Interval_1 = __importDefault(require("./Interval"));
const MetricResult_1 = __importDefault(require("./MetricResult"));
class AlertQuery {
    getEvaluateInterval() {
        return this.query.evaluateInterval;
    }
    /**
     * Set the query parameters.
     * Defines the data set to be evaluated.
     * It is recommended to select parameters taking into account the set evaluation interval.
     * For example, you should not take a period shorter than the set evaluation interval.
     * It is recommended to select the query interval as close to the layer accuracy as possible.
     * The `func` function will be applied to the obtained query result
     *
     * @param evaluateInterval Sets the interval at which the data will be evaluated.
     * @param interval Interval of query use standart interval format
     * @param period Period of query. For example 'now-1d:now' @see Interval.period
     * @param func Aggregation function of query. @see MetricResult.aggregate
    */
    constructor(evaluateInterval, interval, period, func) {
        this.query = {
            evaluateInterval: '15s',
            interval: '1s',
            period: 'now-15s:now',
            func: 'avg'
        };
        Interval_1.default.period(period);
        Interval_1.default.parseInterval(evaluateInterval);
        Interval_1.default.parseInterval(interval);
        MetricResult_1.default.isAggregateFunc(func);
        this.query = { evaluateInterval, interval, period, func };
        return this;
    }
    export() { return this.query; }
    import(query) { this.query = query; }
}
exports.default = AlertQuery;
