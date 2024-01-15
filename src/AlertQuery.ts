/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/


import Interval from "./Interval";
import MetricResult, { EAggregateFunctions } from "./MetricResult";

export interface IAlertQuery {
    readonly evaluateInterval: string,
    readonly interval: string,
    readonly period: string,
    readonly func: string,
}

export default class AlertQuery {
    query:IAlertQuery  = {
        evaluateInterval: '15s',
        interval: '1s',
        period: 'now-15s:now',
        func: 'avg'
    }

    getEvaluateInterval(){
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
    constructor(evaluateInterval:string, interval: string, period:string, func: keyof typeof EAggregateFunctions){
        Interval.period(period)
        Interval.parseInterval(evaluateInterval)
        Interval.parseInterval(interval)
        MetricResult.isAggregateFunc(func)
        this.query = { evaluateInterval, interval, period, func }
        return this
    }

    export() { return this.query }
    import(query: IAlertQuery ) { this.query = query }
}