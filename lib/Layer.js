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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Interval_1 = __importDefault(require("./Interval"));
const MetricResult_1 = __importDefault(require("./MetricResult"));
const MetricWrite_1 = __importDefault(require("./MetricWrite"));
const LayerStorage_1 = __importStar(require("./LayerStorage/LayerStorage"));
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Typing_1 = __importDefault(require("./Typing"));
ErrorManager_1.default.register('Aht5U892ICXv', 'VDB_LAYER_SIZE', 'Incorrect size of layer (interval > period)');
ErrorManager_1.default.register('iQT3d2SflYQY', 'VDB_LAYER_SECTION', 'Incorrect section - The beginning is greater than the end');
ErrorManager_1.default.register('ir1hjNJ0GA0j', 'VDB_LAYER_INITIAL_DATA', 'Incorrect interval or period type, values must be integer and greater than zero');
ErrorManager_1.default.register('VWkc3gQ9g1DM', 'VDB_LAYER_VALUE', 'Incorrect type given, type number is required');
ErrorManager_1.default.register('gVCGXR03XycW', 'VDB_LAYER_TIME', 'Incorrect type given, type integer is required');
ErrorManager_1.default.register('5I1vWpnAH2zM', 'VDB_LAYER_PRECISION', 'Incorrect type given, values must be integer and greater than zero');
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
class Layer {
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
    constructor({ interval, period, vStorage = null, tStorage = null, CInterval = Interval_1.default }) {
        /** Interval class (see Interval, IntervalMs, IntervalUs) */
        this.CInterval = Interval_1.default;
        if (interval >= period)
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_SIZE', { interval, period });
        if (!Typing_1.default.isUInt(interval) || !Typing_1.default.isUInt(period))
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_INITIAL_DATA', { interval, period });
        this._interval = interval;
        this._period = period;
        this.CInterval = CInterval;
        // get cells count in layer
        this._cells = Math.floor(period / this._interval);
        this._timeStorage = LayerStorage_1.default.make(tStorage, LayerStorage_1.StorageTypes.Uint64, this._cells);
        this._valueStorage = LayerStorage_1.default.make(vStorage, LayerStorage_1.StorageTypes.Float, this._cells);
        const time = this.CInterval.now();
        // Fill basic data for new layer
        this._startTime = this.CInterval.roundTime(time - (this._interval * (this._cells - 1)), this._interval);
        this._endTime = this.CInterval.roundTime(time, this._interval);
    }
    /**
     * Clear layer data
    */
    clear() {
        this._timeStorage.buffer.fill(0);
    }
    /**
     * Returns the size of the layer in bytes
    */
    get length() {
        return this._valueStorage.buffer.length + this._timeStorage.buffer.length;
    }
    /**
     * Layer accuracy in MTU
     */
    get interval() {
        return this._interval;
    }
    /**
    * Number of intervals in a layer
    *
    * Old method timeSize is deprecated & deleted
    */
    get period() {
        return this._period;
    }
    /**
    * Number of intervals in a layer
    */
    get cells() {
        return this._cells;
    }
    /**
     * Initial point of time in the layer
    */
    get startTime() {
        return this._startTime;
    }
    /**
     * End point of time in the layer
     * */
    get endTime() {
        return this._endTime;
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
    write(time, value, func = 'last') {
        if (typeof value !== 'number')
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_VALUE', { value });
        if (typeof time !== 'number')
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_TIME', { time });
        const oTime = this.CInterval.roundTime(time, this._interval);
        /**
         * If we receive a value with a time that exceeds the length of our buffer
         * We consider that there is no more actual data in this buffer and we set
         * startTime equal to our endTime and get a buffer with 1 value
        */
        if (this._endTime < (oTime - this._cells * this._interval))
            this._startTime = oTime;
        /**
         * We've got a value less than the start of the layer
         * We need to rebuild it, so we need this.endTime
         * To be less than oTime
         * Then the following condition will do it for us
        */
        if (oTime < this._startTime) {
            this._endTime = oTime - this._interval;
        }
        /**
         * We've got a time value greater than the last time, so we need to move
         * the end of our queue to the next index and replace endTime
        */
        if (this._endTime < oTime) {
            const sTime = this.CInterval.roundTime(time - (this._interval * (this._cells - 1)), this._interval);
            this._startTime = sTime;
            this._endTime = oTime;
        }
        const index = this.getIndex(time);
        this.writeBuffer(index, oTime, value, func);
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
    readInterval(start, end) {
        if (start < this._startTime)
            start = this._startTime;
        if (end > this._endTime)
            end = this._endTime;
        if (start > end)
            end = this._endTime;
        const ils = this.CInterval.getIntervals(start, end, this._interval);
        const result = { relevant: true, start, end, rows: [] };
        for (let i = 0; i < ils.length; i++)
            result.rows.push(this.readOne(ils[i]));
        return result;
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
    readCustomInterval(start, end, precision, func = 'last') {
        if (!Typing_1.default.isUInt(precision))
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_PRECISION', { precision });
        if (start < this._startTime)
            start = this._startTime;
        if (end > this._endTime)
            end = this._endTime;
        if (!precision)
            precision = this._interval;
        if (start > end)
            throw ErrorManager_1.default.make(new Error, 'VDB_LAYER_SECTION', { start, end });
        const result = { relevant: true, start, end, rows: [] };
        const ils = this.CInterval.getIntervals(start, end, precision);
        let to;
        for (let i = 0; i < ils.length; i++) {
            if (this._startTime > ils[i])
                continue;
            if (precision <= this._interval) {
                to = ils[i];
            }
            else {
                to = (ils[i] + precision) - this._interval;
                if (to < ils[i])
                    to = ils[i];
            }
            const tres = this.readInterval(ils[i], to); // Count the interval with data
            const val = {
                time: ils[i],
                value: MetricResult_1.default.aggregate(tres, func)
            };
            result.rows.push(val);
        }
        return result;
    }
    /**
     * Return all points in layer
     * See example!
     *
     * @example console.table(layer.dump())
    */
    dump() {
        const rows = [];
        for (let i = 0; i < this._cells; i++)
            rows.push(this.readBuffer(i));
        return rows;
    }
    /**
     * Reads 1 index by time and retrieves its value
     *
     * @param {number} time time
    */
    readOne(time) {
        const metric = this.readBuffer(this.getIndex(time));
        metric.time = time;
        return metric;
    }
    /**
     * Returns the time index
     *
     * @param {number} time time in MTU
    */
    getIndex(time) {
        return Math.floor(this._cells + time / this._interval) % this._cells;
    }
    /**
     * Checks if the time is valid for the current state
     * of the layer, in fact it checks if the time is within the interval
     * of the layer's current active time
     *
     * @param {number} time Time in MTU
    */
    validTime(time) {
        return (time >= this._startTime && time <= this._endTime);
    }
    /**
     * Reading metrics by index
     *
     * @param {number} index Metrics Index
     * @returns {IMetric} Metric value
    */
    readBuffer(index) {
        const time = this._timeStorage.readBuffer(index);
        let value = this._valueStorage.readBuffer(index);
        if (!this.validTime(time))
            value = null;
        return { time, value };
    }
    /**
     * Writes data to the buffer
     *
     * @param {number} index Metric Index
     * @param {number} time Time for recording
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    writeBuffer(index, time, value, func = 'last') {
        value = this.modifyWrite(index, value, func);
        this._timeStorage.writeBuffer(index, time);
        this._valueStorage.writeBuffer(index, value);
    }
    /**
     * Modifies the data before writing the buffer
     *
     * @param {number} index Metrics Index
     * @param {number} value Value for recording
     * @param {string} func Modification function
    */
    modifyWrite(index, value, func) {
        const val = this.readBuffer(index);
        if (val.value === null)
            return value;
        return MetricWrite_1.default.modify(val.value, value, func);
    }
}
exports.default = Layer;
