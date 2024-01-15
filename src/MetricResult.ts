/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import ErrorManager from "./Errors/ErrorManager";
import { IMetric, IMetricReadResult } from "./Layer";


ErrorManager.register('L0B9VGXqu6PB', 'VDB_METRIC_AGGREGATE_TYPE', 'Unknown aggregation type')

export enum EAggregateFunctions {
    last = "last",
    first = "first",
    max = "max",
    min = "min",
    avg = "avg",
    sum = "sum",
}


/**
 * Helper for processing the obtained results of metrics readings
*/
export default class MetricResult {

    static isAggregateFunc(func: string, useExcept = false){
        if (EAggregateFunctions[func as keyof typeof EAggregateFunctions] !== undefined) return true
        if (useExcept) throw ErrorManager.make('VDB_METRIC_AGGREGATE_TYPE', { func })
        return false
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
    static aggregate(data: IMetricReadResult, func = 'last') {
        switch (func) {
            case 'last':
                return MetricResult.#last(data)
            case 'first':
                return MetricResult.#first(data)
            case 'max':
                return MetricResult.#max(data)
            case 'min':
                return MetricResult.#min(data)
            case 'avg':
                return MetricResult.#avg(data)
            case 'sum':
                return MetricResult.#sum(data)
            default:
                throw ErrorManager.make('VDB_METRIC_AGGREGATE_TYPE', { func })
        }
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #last(data: IMetricReadResult): number | null {
        for (let k = data.rows.length; k > 0; k--) {
            const row = data.rows[k - 1]
            if (row.value !== null) return row.value
        }
        return null
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #first(data: IMetricReadResult): number | null {
        for (let k = 0; k < data.rows.length; k++) {
            if (data.rows[k].value !== null) return data.rows[k].value
        }
        return null
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #max(data: IMetricReadResult): number | null {
        let res: null | number = null
        for (let k = 0; k < data.rows.length; k++) {
            const row: IMetric = data.rows[k]
            if (row.value !== null && res === null) res = row.value
            if (row.value !== null && res !== null) {
                if (row.value > res) res = row.value
            }
        }
        return res
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #min(data: IMetricReadResult): number | null {
        let res: null | number = null
        for (let k = 0; k < data.rows.length; k++) {
            const row: IMetric = data.rows[k]
            if (row.value !== null && res === null) res = row.value
            if (row.value !== null && res !== null) {
                if (row.value < res) res = row.value
            }
        }
        return res
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #avg(data: IMetricReadResult): number | null {
        let res = 0
        let count = 0
        for (let k = 0; k < data.rows.length; k++) {
            const row: IMetric = data.rows[k]
            if (row.value !== null) { res += row.value; count++ }
        }
        if (count === 0) return null
        return res / count
    }

    /**
     * @param {IMetricReadResult} data Aggregation data
    */
    static #sum(data: IMetricReadResult): number | null {
        let res: null | number = null
        for (let k = 0; k < data.rows.length; k++) {
            const row: IMetric = data.rows[k]
            if (row.value !== null && res === null) { res = row.value }
            if (row.value !== null && res !== null) { res += row.value }
        }
        return res
    }

}
