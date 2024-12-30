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
    /** Time in MTU */
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


export interface ILayerOptions {
    /**
     * Defines the accuracy with which the data will be stored,
     * for example 10 - 10 MTU. After specifying 10 MTU, this layer will not be able to store data for more than 10 MTU.
     * */
    interval: number,

    /**
     * Determines the total data storage period, 
     * 100 - 100 MTU , i.e. this layer will not be able to store data for more than 100 MTU.
    */
    period: number,

    /**
     * Value storage type
     * @see StorageTypes
    */
    vStorage?: StorageTypes | null,

    /**
     * Time storage type
     * @see StorageTypes
    */
    tStorage?: StorageTypes | null,

    /**
     * Class interval - Determines the MTU for a new layer.
    */
    CInterval?: typeof Interval
}

ErrorManager.register('Aht5U892ICXv', 'VDB_LAYER_SIZE', 'Incorrect size of layer (interval > period)')
ErrorManager.register('iQT3d2SflYQY', 'VDB_LAYER_SECTION', 'Incorrect section - The beginning is greater than the end')
ErrorManager.register('ir1hjNJ0GA0j', 'VDB_LAYER_INITIAL_DATA', 'Incorrect interval or period type, values must be integer and greater than zero')
ErrorManager.register('VWkc3gQ9g1DM', 'VDB_LAYER_VALUE', 'Incorrect type given, type number is required')
ErrorManager.register('gVCGXR03XycW', 'VDB_LAYER_TIME', 'Incorrect type given, type integer is required')
ErrorManager.register('5I1vWpnAH2zM', 'VDB_LAYER_PRECISION', 'Incorrect type given, values must be integer and greater than zero')

/**
 * A layer is a low level for storing information. 
 * The layer works with such a concept as MTU - minimum time unit. MTU is a unit of time represented as an integer.
 * For class Interval MTU = 1 second. For IntervalMs MTU = 1 millisecond. For class IntervalUs = microsecond
 * 
 * Example of creating a layer with 10 memory cells
 * 
 * ```ts
 * const lay = new Layer({ interval: 1, period: 10}) 
 * ```
 * 
 * For more details, it is recommended to read the official guide
 * 
 * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
 * 
*/
export default class Layer {

    /** Layer accuracy in MTU */
    protected _interval: number;

    /** Period of layer in MTU */
    protected _period: number;

    /** Number of intervals in a layer */
    protected _cells: number

    /** Initial point of time in the layer */
    protected _startTime: number

    /** End point of time in the layer */
    protected _endTime: number

    /**  Value store */
    protected _valueStorage: IStorage

    /** Time Vault */
    protected _timeStorage: IStorage

    /** Interval class (see Interval, IntervalMs, IntervalUs) */
    CInterval: typeof Interval = Interval

    /**
     * Creating a new storage with a certain accuracy (interval) and size (period)
     * 
     * **The interval cannot be less than the period**
     * 
     * @example  new Layer({ interval: 1, period: 10}) // Creates a layer with an interval of 1 MTU and a period of 10 MTU
     * 
     * @see ILayerOptions
     * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
    */
    constructor({ interval, period, vStorage = null, tStorage = null, CInterval = Interval }: ILayerOptions) {
        if (interval >= period) throw ErrorManager.make(new Error, 'VDB_LAYER_SIZE', { interval, period })
        if (!Typing.isUInt(interval) || !Typing.isUInt(period)) throw ErrorManager.make(new Error, 'VDB_LAYER_INITIAL_DATA', { interval, period })
        this._interval = interval
        this._period = period
        this.CInterval = CInterval

        // get cells count in layer
        this._cells = Math.floor(period / this._interval)
        this._timeStorage = LayerStorage.make(tStorage, StorageTypes.Uint64, this._cells)
        this._valueStorage = LayerStorage.make(vStorage, StorageTypes.Float, this._cells)
        const time = this.CInterval.now()

        // Fill basic data for new layer
        this._startTime = this.CInterval.roundTime(time - (this._interval * (this._cells - 1)), this._interval)
        this._endTime = this.CInterval.roundTime(time, this._interval)
    }

    /**
     * Clear layer data
    */
    clear() {
        this._timeStorage.buffer.fill(0)
    }

    /**
     * Returns the size of the layer in bytes
    */
    get length (){
        return this._valueStorage.buffer.length + this._timeStorage.buffer.length
    }

    /** 
     * Layer accuracy in MTU 
     */
    get interval() {
        return this._interval
    }

    /** 
    * Number of intervals in a layer 
    * 
    * Old method timeSize is deprecated & deleted
    */
    get period() {
        return this._period
    }

    /** 
    * Number of intervals in a layer 
    */
    get cells() {
        return this._cells
    }

    /**
     * Initial point of time in the layer
    */
    get startTime() {
        return this._startTime
    }

    /** 
     * End point of time in the layer 
     * */
    get endTime() {
        return this._endTime
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
     * @param {number} time Time in MTU
     * @param {number} value Value to be recorded
     * @param {string} func Modification function
    */
    write(time: number, value: number, func = 'last') {

        if (typeof value !== 'number') throw ErrorManager.make(new Error, 'VDB_LAYER_VALUE', { value })
        if (typeof time !== 'number') throw ErrorManager.make(new Error, 'VDB_LAYER_TIME', { time })

        const oTime = this.CInterval.roundTime(time, this._interval)

        /**
         * If we receive a value with a time that exceeds the length of our buffer
         * We consider that there is no more actual data in this buffer and we set
         * startTime equal to our endTime and get a buffer with 1 value
        */
        if (this._endTime < (oTime - this._cells * this._interval)) this._startTime = oTime

        /**
         * We've got a value less than the start of the layer
         * We need to rebuild it, so we need this.endTime
         * To be less than oTime
         * Then the following condition will do it for us
        */
        if (oTime < this._startTime) {
            this._endTime = oTime - this._interval
        }

        /**
         * We've got a time value greater than the last time, so we need to move 
         * the end of our queue to the next index and replace endTime
        */
        if (this._endTime < oTime) {
            const sTime = this.CInterval.roundTime(time - (this._interval * (this._cells - 1)), this._interval)
            this._startTime = sTime
            this._endTime = oTime
        }

        const index = this.getIndex(time)
        this.writeBuffer(index, oTime, value, func)
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
        if (start < this._startTime) start = this._startTime
        if (end > this._endTime) end = this._endTime
        if (start > end) end = this._endTime
        const ils = this.CInterval.getIntervals(start, end, this._interval)
        const result: IMetricReadResult = { relevant: true, start, end, rows: [] }
        for (let i = 0; i < ils.length; i++) result.rows.push(this.readOne(ils[i]))
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
        if (!Typing.isUInt(precision)) throw ErrorManager.make(new Error, 'VDB_LAYER_PRECISION', { precision })
        if (start < this._startTime) start = this._startTime
        if (end > this._endTime) end = this._endTime
        if (!precision) precision = this._interval
        if (start > end) throw ErrorManager.make(new Error, 'VDB_LAYER_SECTION', { start, end })
        const result: IMetricReadResult = { relevant: true, start, end, rows: [] }
        const ils: Array<number> = this.CInterval.getIntervals(start, end, precision)
        let to: number;
        for (let i = 0; i < ils.length; i++) {
            if (this._startTime > ils[i]) continue
            if (precision <= this._interval) { to = ils[i]; }
            else { to = (ils[i] + precision) - this._interval; if (to < ils[i]) to = ils[i] }
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
     * See example!
     * 
     * @example console.table(layer.dump())
    */
    dump() {
        const rows: Array<IMetric> = []
        for (let i = 0; i < this._cells; i++) rows.push(this.readBuffer(i))
        return rows
    }

    /**
     * Reads 1 index by time and retrieves its value
     * 
     * @param {number} time time
    */
    protected readOne(time: number): IMetric {
        const metric = this.readBuffer(this.getIndex(time))
        metric.time = time
        return metric
    }

    /**
     * Returns the time index
     * 
     * @param {number} time time in MTU
    */
    protected getIndex(time: number) {
        return Math.floor(this._cells + time / this._interval) % this._cells;
    }

    /**
     * Checks if the time is valid for the current state 
     * of the layer, in fact it checks if the time is within the interval 
     * of the layer's current active time
     * 
     * @param {number} time Time in MTU
    */
    protected validTime(time: number) {
        return (time >= this._startTime && time <= this._endTime)
    }

    /**
     * Reading metrics by index
     * 
     * @param {number} index Metrics Index
     * @returns {IMetric} Metric value
    */
    protected readBuffer(index: number): IMetric {
        const time = this._timeStorage.readBuffer(index)
        let value: number | null = this._valueStorage.readBuffer(index)
        if (!this.validTime(time)) value = null
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
    protected writeBuffer(index: number, time: number, value: number, func = 'last') {
        value = this.modifyWrite(index, value, func)
        this._timeStorage.writeBuffer(index, time)
        this._valueStorage.writeBuffer(index, value)
    }

    /**
     * Modifies the data before writing the buffer
     * 
     * @param {number} index Metrics Index
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    protected modifyWrite(index: number, value: number, func: string) {
        const val = this.readBuffer(index)
        if (val.value === null) return value
        return MetricWrite.modify(val.value, value, func)
    }
}
