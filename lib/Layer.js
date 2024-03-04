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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Layer_instances, _Layer_valueStorage, _Layer_timeStorage, _Layer_readOne, _Layer_getIndex, _Layer_validTime, _Layer_readBuffer, _Layer_writeBuffer, _Layer_modifyWrite;
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
 * See the documentation for the layer
 *
 * @see /docs/layer.md
*/
class Layer {
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
    constructor(interval, period, vStorage = null, tStorage = null) {
        _Layer_instances.add(this);
        /**  Value store */
        _Layer_valueStorage.set(this, void 0);
        /** Time Vault */
        _Layer_timeStorage.set(this, void 0);
        if (interval >= period)
            throw ErrorManager_1.default.make('VDB_LAYER_SIZE', { interval, period });
        if (!Typing_1.default.isUInt(interval) || !Typing_1.default.isUInt(period))
            throw ErrorManager_1.default.make('VDB_LAYER_INITIAL_DATA', { interval, period });
        this.interval = interval;
        this.period = period;
        this.points = Math.floor(period / this.interval);
        __classPrivateFieldSet(this, _Layer_valueStorage, LayerStorage_1.default.make(vStorage, LayerStorage_1.StorageTypes.Float, this.points), "f");
        __classPrivateFieldSet(this, _Layer_timeStorage, LayerStorage_1.default.make(tStorage, LayerStorage_1.StorageTypes.Uint64, this.points), "f");
        const time = Interval_1.default.now();
        this.startTime = Interval_1.default.roundTime(time - (this.interval * (this.points - 1)), this.interval);
        this.endTime = Interval_1.default.roundTime(time, this.interval);
    }
    /**
     * Clear layer data
    */
    clear() {
        __classPrivateFieldGet(this, _Layer_timeStorage, "f").buffer.fill(0);
    }
    /**
     * Returns the size of the layer in bytes
    */
    size() {
        return __classPrivateFieldGet(this, _Layer_valueStorage, "f").buffer.length + __classPrivateFieldGet(this, _Layer_timeStorage, "f").buffer.length;
    }
    /**
     * Returns the total time of the layer in seconds
     * */
    timeSize() {
        return this.period;
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
    write(time, value, func = 'last') {
        if (typeof value !== 'number')
            throw ErrorManager_1.default.make('VDB_LAYER_VALUE', { value });
        if (typeof time !== 'number')
            throw ErrorManager_1.default.make('VDB_LAYER_TIME', { time });
        const oTime = Interval_1.default.roundTime(time, this.interval);
        /**
         * If we receive a value with a time that exceeds the length of our buffer
         * We consider that there is no more actual data in this buffer and we set
         * startTime equal to our endTime and get a buffer with 1 value
        */
        if (this.endTime < (oTime - this.points * this.interval))
            this.startTime = oTime;
        /**
         * We've got a value less than the start of the layer
         * We need to rebuild it, so we need this.endTime
         * To be less than oTime
         * Then the following condition will do it for us
        */
        if (oTime < this.startTime) {
            this.endTime = oTime - this.interval;
        }
        /**
         * We've got a time value greater than the last time, so we need to move
         * the end of our queue to the next index and replace endTime
        */
        if (this.endTime < oTime) {
            const sTime = Interval_1.default.roundTime(time - (this.interval * (this.points - 1)), this.interval);
            this.startTime = sTime;
            this.endTime = oTime;
        }
        const index = __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_getIndex).call(this, time);
        __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_writeBuffer).call(this, index, oTime, value, func);
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
        if (start < this.startTime)
            start = this.startTime;
        if (end > this.endTime)
            end = this.endTime;
        if (start > end)
            end = this.endTime;
        const ils = Interval_1.default.getIntervals(start, end, this.interval);
        const result = { relevant: true, start, end, rows: [] };
        for (let i = 0; i < ils.length; i++)
            result.rows.push(__classPrivateFieldGet(this, _Layer_instances, "m", _Layer_readOne).call(this, ils[i]));
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
            throw ErrorManager_1.default.make('VDB_LAYER_PRECISION', { precision });
        if (start < this.startTime)
            start = this.startTime;
        if (end > this.endTime)
            end = this.endTime;
        if (!precision)
            precision = this.interval;
        if (start > end)
            throw ErrorManager_1.default.make('VDB_LAYER_SECTION', { start, end });
        const result = { relevant: true, start, end, rows: [] };
        const ils = Interval_1.default.getIntervals(start, end, precision);
        let to;
        for (let i = 0; i < ils.length; i++) {
            if (this.startTime > ils[i])
                continue;
            if (precision <= this.interval) {
                to = ils[i];
            }
            else {
                to = (ils[i] + precision) - this.interval;
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
     *
     * @example console.table(layer.dump())
    */
    dump() {
        const rows = [];
        for (let i = 0; i < this.points; i++)
            rows.push(__classPrivateFieldGet(this, _Layer_instances, "m", _Layer_readBuffer).call(this, i));
        return rows;
    }
}
exports.default = Layer;
_Layer_valueStorage = new WeakMap(), _Layer_timeStorage = new WeakMap(), _Layer_instances = new WeakSet(), _Layer_readOne = function _Layer_readOne(time) {
    const metric = __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_readBuffer).call(this, __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_getIndex).call(this, time));
    metric.time = time;
    return metric;
}, _Layer_getIndex = function _Layer_getIndex(time) {
    return Math.floor(this.points + time / this.interval) % this.points;
}, _Layer_validTime = function _Layer_validTime(time) {
    return (time >= this.startTime && time <= this.endTime);
}, _Layer_readBuffer = function _Layer_readBuffer(index) {
    const time = __classPrivateFieldGet(this, _Layer_timeStorage, "f").readBuffer(index);
    let value = __classPrivateFieldGet(this, _Layer_valueStorage, "f").readBuffer(index);
    if (!__classPrivateFieldGet(this, _Layer_instances, "m", _Layer_validTime).call(this, time))
        value = null;
    return { time, value };
}, _Layer_writeBuffer = function _Layer_writeBuffer(index, time, value, func = 'last') {
    value = __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_modifyWrite).call(this, index, value, func);
    __classPrivateFieldGet(this, _Layer_timeStorage, "f").writeBuffer(index, time);
    __classPrivateFieldGet(this, _Layer_valueStorage, "f").writeBuffer(index, value);
}, _Layer_modifyWrite = function _Layer_modifyWrite(index, value, func) {
    const val = __classPrivateFieldGet(this, _Layer_instances, "m", _Layer_readBuffer).call(this, index);
    if (val.value === null)
        return value;
    return MetricWrite_1.default.modify(val.value, value, func);
};
