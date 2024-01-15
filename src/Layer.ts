/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import Interval from "./Interval";
import IStorage from "./LayerStorage/IStorage";
import MetricResult from "./MetricResult";
import MetricWrite from "./MetricWrite";
import LayerStorage, { StorageTypes } from "./LayerStorage/LayerStorage";
import ErrorManager from "./Errors/ErrorManager";
import Typing from "./Typing";

/**
 * Metric storage object interface
 * It is allowed to use null for a value when 
 * no value can be obtained for a given time
*/
export interface IMetric {
    /** Time in seconds */
    time: number,
    value: number | null
}

/***
 * Intefrace to output the results of the metrics query
 **/
export interface IMetricReadResult {
    /** result relevance flag */
    relevant: boolean
    /** Beginning of the period */
    start: number,
    /** End of period */
    end: number,
    /** Metrics array */
    rows: Array<IMetric>
}

ErrorManager.register('Aht5U892ICXv', 'VDB_LAYER_SIZE', 'Incorrect size of layer (interval > period)')
ErrorManager.register('iQT3d2SflYQY', 'VDB_LAYER_SECTION', 'Incorrect section - The beginning is greater than the end')
ErrorManager.register('ir1hjNJ0GA0j', 'VDB_LAYER_INITIAL_DATA', 'Incorrect interval or period type, values must be integer and greater than zero')
ErrorManager.register('VWkc3gQ9g1DM', 'VDB_LAYER_VALUE', 'Incorrect type given, type number is required')
ErrorManager.register('gVCGXR03XycW', 'VDB_LAYER_TIME', 'Incorrect type given, type integer is required')
ErrorManager.register('5I1vWpnAH2zM', 'VDB_LAYER_PRECISION', 'Incorrect type given, values must be integer and greater than zero')


/**
 * See the documentation for the layer
 * 
 * @see /docs/layer.md
*/
export default class Layer {
    /** Layer accuracy in seconds */
    interval: number;

    /** Period of layer */
    period: number;

    /** Number of intervals in a layer */
    points: number

    /** Initial point of time in the layer */
    startTime: number

    /** End point of time in the layer */
    endTime: number

    /**  Value store */
    #valueStorage: IStorage

    /** Time Vault */
    #timeStorage: IStorage


    /**
     * Creating a new storage with a certain accuracy (interval) and size (period)
     * 
     * **Layer accuracy cannot be greater than the total storage interval**
     * 
     * @example  new Layer(1, 10) // Creates a layer with an interval of 1 second and a period of 10 seconds
     *  
     * @param {number} interval Defines the accuracy with which the data will be stored,
     * for example 10 - 10 seconds. After specifying 10 seconds, this layer will not be able to store data for more than 10 seconds.
     * 
     * @param {number} period Determines the total data storage period, 
     * 100 - 100sec , i.e. this layer will not be able to store data for more than 100sec.
    */
    constructor(interval: number, period: number, vStorage: StorageTypes | null = null, tStorage: StorageTypes | null = null) {
        if (interval >= period) throw ErrorManager.make('VDB_LAYER_SIZE', { interval, period })
        if (!Typing.isUInt(interval) || !Typing.isUInt(period)) throw ErrorManager.make('VDB_LAYER_INITIAL_DATA', { interval, period })
        this.interval = interval
        this.period = period
        this.points = Math.floor(period / this.interval)
        this.#valueStorage = LayerStorage.make(vStorage, StorageTypes.Float, this.points)
        this.#timeStorage = LayerStorage.make(tStorage, StorageTypes.Uint64, this.points)
        const time = Interval.now()
        this.startTime = Interval.roundTime(time - (this.interval * (this.points - 1)), this.interval)
        this.endTime = Interval.roundTime(time, this.interval)
    }

    /**
     * Clear layer data
    */
    clear() {
        this.#timeStorage.buffer.fill(0)
    }

    /**
     * Returns the size of the layer in bytes
    */
    size(): number {
        return this.#valueStorage.buffer.length + this.#timeStorage.buffer.length
    }

    /** 
     * Returns the total time of the layer in seconds
     * */
    timeSize(): number {
        return this.period
    }

    /**
     * Writes the value into the layer
     * 
     * Automatically adjusts the layer time (startTime/endTime).
     * 
     * **It is necessary to take into account that the layer may not work correctly 
     * If you write data from different time intervals larger than the layer size**.
     * 
     * Works best when data is written sequentially (in time)
     * 
     * @param {number} time Time in seconds
     * @param {number} value Value to be recorded
     * @param {string} func Modification function
    */
    write(time: number, value: number, func = 'last') {

        if (typeof value !== 'number') throw ErrorManager.make('VDB_LAYER_VALUE', { value })
        if (typeof time !== 'number') throw ErrorManager.make('VDB_LAYER_TIME', { time })

        const oTime = Interval.roundTime(time, this.interval)

        /**
         * If we receive a value with a time that exceeds the length of our buffer
         * We consider that there is no more actual data in this buffer and we set
         * startTime equal to our endTime and get a buffer with 1 value
        */
        if (this.endTime < (oTime - this.points * this.interval)) this.startTime = oTime

        /**
         * We've got a value less than the start of the layer
         * We need to rebuild it, so we need this.endTime
         * To be less than oTime
         * Then the following condition will do it for us
        */
        if (oTime < this.startTime) {
            this.endTime = oTime - this.interval
        }

        /**
         * We've got a time value greater than the last time, so we need to move 
         * the end of our queue to the next index and replace endTime
        */
        if (this.endTime < oTime) {
            const sTime = Interval.roundTime(time - (this.interval * (this.points - 1)), this.interval)
            this.startTime = sTime
            this.endTime = oTime
        }

        const index = this.#getIndex(time)
        this.#writeBuffer(index, oTime, value, func)
    }

    /**
     * Returns data in the interval start -> end with layer accuracy
     * 
     * If the specified start and end are outside the layer, they will be converted to layer frames
     * this will be indicated in the result
     * 
     * Start -> end parameters are automatically rounded to layer accuracy
     * 
     * If there is a need to get data with arbitrary precision 
     * it is better to use `readCustomInterval`.
     * 
     * @see readCustomInterval
     * 
     * @param {number} start Start time
     * @param {number} end End time
    */
    readInterval(start: number, end: number) {
        if (start < this.startTime) start = this.startTime
        if (end > this.endTime) end = this.endTime
        if (start > end) end = this.endTime
        const ils = Interval.getIntervals(start, end, this.interval)
        const result: IMetricReadResult = { relevant: true, start, end, rows: [] }
        for (let i = 0; i < ils.length; i++) result.rows.push(this.#readOne(ils[i]))
        return result
    }


    /**
     * Allows data to be read from a layer at a different precision than the layer's native one
     * Supports both smaller intra-layer precision and larger intra-layer precision.
     * This can be useful for looking at a complex graph in more detail,
     * or aggregating data with the LAST function to view a less detailed graph.
     * 
     * If the specified start and end are outside the layer, they will be brought to the layer boundaries.
     * this will be indicated in the result
     * 
     * @param {number} start Start time
     * @param {number} end End time
     * @param {number} precision 
    */
    readCustomInterval(start: number, end: number, precision: number, func = 'last'): IMetricReadResult {
        if (!Typing.isUInt(precision)) throw ErrorManager.make('VDB_LAYER_PRECISION', { precision })
        if (start < this.startTime) start = this.startTime
        if (end > this.endTime) end = this.endTime
        if (!precision) precision = this.interval
        if (start > end) throw ErrorManager.make('VDB_LAYER_SECTION', { start, end })
        const result: IMetricReadResult = { relevant: true, start, end, rows: [] }
        const ils: Array<number> = Interval.getIntervals(start, end, precision)
        let to: number;
        for (let i = 0; i < ils.length; i++) {
            if (precision <= this.interval) { to = ils[i]; }
            else { to = (ils[i] + precision) - this.interval; if (to < ils[i]) to = ils[i] }
            const tres = this.readInterval(ils[i], to) // Count the interval with data
            const val: IMetric = {
                time: ils[i],
                value: MetricResult.aggregate(tres, func)
            }
            result.rows.push(val)
        }
        return result
    }

    /**
     * Return all points in layer
     * 
     * @example console.table(layer.dump())
    */
    dump() {
        const rows: Array<IMetric> = []
        for (let i = 0; i < this.points; i++) rows.push(this.#readBuffer(i))
        return rows
    }

    /**
     * Reads 1 index by time and retrieves its value
     * 
     * @param {number} time time
    */
    #readOne(time: number): IMetric {
        const metric = this.#readBuffer(this.#getIndex(time))
        metric.time = time
        return metric
    }

    /**
     * Returns the time index
     * 
     * @param {number} time time in seconds
    */
    #getIndex(time: number) {
        return Math.floor(this.points + time / this.interval) % this.points;
    }

    /**
     * Checks if the time is valid for the current state 
     * of the layer, in fact it checks if the time is within the interval 
     * of the layer's current active time
     * 
     * @param {number} time Time in seconds
    */
    #validTime(time: number) {
        return (time >= this.startTime && time <= this.endTime)
    }

    /**
     * Reading metrics by index
     * 
     * @param {number} index Metrics Index
     * @returns {IMetric} Metric value
    */
    #readBuffer(index: number): IMetric {
        const time = this.#timeStorage.readBuffer(index)
        let value: number | null = this.#valueStorage.readBuffer(index)
        if (!this.#validTime(time)) value = null
        return { time, value }
    }

    /**
     * Writes data to the buffer
     * 
     * @param {number} index Metric Index
     * @param {number} time Time for recording
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    #writeBuffer(index: number, time: number, value: number, func = 'last') {
        value = this.#modifyWrite(index, value, func)
        this.#timeStorage.writeBuffer(index, time)
        this.#valueStorage.writeBuffer(index, value)
    }

    /**
     * Modifies the data before writing the buffer
     * 
     * @param {number} index Metrics Index
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    #modifyWrite(index: number, value: number, func: string) {
        const val = this.#readBuffer(index)
        if (val.value === null) return value
        return MetricWrite.modify(val.value, value, func)
    }
}
