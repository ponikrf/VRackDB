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
var _Collector_instances, _Collector_mectrics, _Collector_additional, _Collector_findLayers, _Collector_findLayer, _Collector_calcSize;
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const Layer_1 = __importDefault(require("./Layer"));
const Typing_1 = __importDefault(require("./Typing"));
ErrorManager_1.default.register('OM1Mt13G8WXA', 'VDB_COLLECTOR_METRIC_NAME', 'Not the correct name of the metric. Metric should contain Latin letters, numbers and dots');
ErrorManager_1.default.register('5e6zb1eyDNdO', 'VDB_COLLECTOR_NOT_FOUND', 'Metric name not found, please init metric first');
/**
 * Metrics initialization class
 * @see /docs/Collector.md
*/
class Collector {
    constructor() {
        _Collector_instances.add(this);
        /**
         * Contains layers of metrics
         */
        _Collector_mectrics.set(this, {});
        _Collector_additional.set(this, {}
        /**
         * Initializes the metric store with `name` and the precision parameter `retentions`
         *
         * - `name` - Describes the path to the metric in the simplified graphite format (path.to.metric)
         * - `retentions` - Describes the layers of the collection, description like graphite carbon
         * of type 10s:1m where 10s is 10 seconds interval and 1m is 1 minute total period of the layer
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
         * @see Interval.retentions
         *
         * You can specify several layers at once with different precision using commas
         * for example `Interval.retentions` '10s:1m, 1m:6h, 1h:1w'.
         *
         * @example Collector.initMetric('test.metric', '10s:1h')
         *
         * @param {string} name Metric name
         * @param {string} retentions Interval retentions
         * @param {StorageTypes} vStorage Value storage type
         * @param {StorageTypes} tStorage Time storage type
        */
        );
    }
    /**
     * Initializes the metric store with `name` and the precision parameter `retentions`
     *
     * - `name` - Describes the path to the metric in the simplified graphite format (path.to.metric)
     * - `retentions` - Describes the layers of the collection, description like graphite carbon
     * of type 10s:1m where 10s is 10 seconds interval and 1m is 1 minute total period of the layer
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
     * @see Interval.retentions
     *
     * You can specify several layers at once with different precision using commas
     * for example `Interval.retentions` '10s:1m, 1m:6h, 1h:1w'.
     *
     * @example Collector.initMetric('test.metric', '10s:1h')
     *
     * @param {string} name Metric name
     * @param {string} retentions Interval retentions
     * @param {StorageTypes} vStorage Value storage type
     * @param {StorageTypes} tStorage Time storage type
    */
    init(name, retentions, vStorage = null, tStorage = null) {
        if (!Typing_1.default.isName(name))
            throw ErrorManager_1.default.make('VDB_COLLECTOR_METRIC_NAME', { name });
        const retArray = Interval_1.default.retentions(retentions);
        for (const ret of retArray) {
            const layer = new Layer_1.default(ret.interval, ret.period, vStorage, tStorage);
            if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
                __classPrivateFieldGet(this, _Collector_mectrics, "f")[name] = [];
            __classPrivateFieldGet(this, _Collector_mectrics, "f")[name].push({
                layer, interval: ret.interval, period: ret.period, retention: ret.retention, vStorage, tStorage
            });
        }
        __classPrivateFieldGet(this, _Collector_mectrics, "f")[name].sort((a, b) => {
            if (a.layer.timeSize() > b.layer.timeSize())
                return -1;
            else if (a.layer.timeSize() < b.layer.timeSize())
                return 1;
            return 0;
        });
        __classPrivateFieldGet(this, _Collector_additional, "f")[name] = { writeCount: 0, firstTime: 0, size: __classPrivateFieldGet(this, _Collector_instances, "m", _Collector_calcSize).call(this, name) };
    }
    /**
     * Clears all metric data
     *
     *
    */
    clear(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        for (const lay of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            lay.layer.clear();
    }
    /**
     * Returns layer settings for the specified metric
     *
     * Modifying the layer settings doesn't make any sense,
     * but modifying the layer buffer may cause it not to work.
     *
     * @param {string} name Metric name
    */
    layers(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        const result = [];
        for (const ls of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            result.push(Object.assign({}, ls));
        return result;
    }
    /**
     * Returns the total size of the occupied memory in bytes Sums the sizes of all layers and returns the result
     *
     * @param {string} name Metric name
     * @return {number} Metric size in bytes
    */
    size(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        return __classPrivateFieldGet(this, _Collector_additional, "f")[name].size;
    }
    /**
     * Checks if the metric exists in the collection
     *
     * @param {string} name Metric name
     * @returns {boolean}
    */
    has(name) {
        if (__classPrivateFieldGet(this, _Collector_mectrics, "f")[name] === undefined)
            return false;
        return true;
    }
    /**
     * Deletes links to the metric in an attempt to free up memory
     * should be aware that in this case no one should be referring to the
     * metric layers, so it is strongly discouraged to use layers outside of
     * `Collector` or `Database`.
     *
     * @param {string} name Metric name
    */
    destroy(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name] === undefined)
            return;
        delete __classPrivateFieldGet(this, _Collector_mectrics, "f")[name];
    }
    /**
     * Writing the value to the database
     *
     * When recording, you can't specify a specific recording time-stamp,
     * it's for a specific purpose, to put it in simple terms, this *
     * approach is needed to do less checking within the base layer
     *
     * @param {string} name The name of the metric in graphite style
     * @param {number} value Value, written as a floating point number of size Double
    */
    write(name, value, time = 0, func = 'last') {
        if (time === 0)
            time = Math.floor(Date.now() / 1000);
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        if (__classPrivateFieldGet(this, _Collector_additional, "f")[name].firstTime === 0 || __classPrivateFieldGet(this, _Collector_additional, "f")[name].firstTime > time) {
            __classPrivateFieldGet(this, _Collector_additional, "f")[name].firstTime = time;
        }
        for (const l of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            l.layer.write(time, value, func);
        __classPrivateFieldGet(this, _Collector_additional, "f")[name].writeCount++;
    }
    /**
     * Reads data from the database from start to end  with precision
     *
     * @param {string} name The name of the metric in graphite style
     * @param {number} start Timestamp of the beginning
     * @param {number} end End Timestamp
     * @param {string} precision The accuracy with which the response should be generated
    */
    read(name, start, end, precision, func = 'last') {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        // We need to find out what layer we're laying in
        start = Interval_1.default.roundTime(start, precision);
        end = Interval_1.default.roundTime(end, precision);
        const sLay = __classPrivateFieldGet(this, _Collector_instances, "m", _Collector_findLayers).call(this, name, start, end, precision);
        const result = {
            relevant: true, start, end, rows: []
        };
        for (const lay of sLay) {
            if (lay.layer === null) {
                const ils = Interval_1.default.getIntervals(lay.start, lay.end, precision);
                for (const time of ils)
                    result.rows.push({ time, value: null });
                continue;
            }
            const tres = lay.layer.layer.readCustomInterval(lay.start, lay.end, precision, func);
            for (const row of tres.rows)
                result.rows.push(row);
        }
        return result;
    }
    /**
     * Returns the estimated start of the metric graph
     *
     * @param {string} name The name of the metric
    */
    start(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        const lays = this.layers(name);
        if (__classPrivateFieldGet(this, _Collector_additional, "f")[name].firstTime < lays[0].layer.startTime)
            return lays[0].layer.startTime;
        return __classPrivateFieldGet(this, _Collector_additional, "f")[name].firstTime;
    }
    /**
     * Returns the estimated end of the metric graph
     *
     * @param {string} name The name of the metric
    */
    end(name) {
        if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
            throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
        const lays = this.layers(name);
        return lays[lays.length - 1].layer.endTime;
    }
    /**
     * Returns the number of writes in the metric
     *
     * @param {string} name The name of the metric
    */
    writeCount(name) {
        return __classPrivateFieldGet(this, _Collector_additional, "f")[name].writeCount;
    }
}
exports.default = Collector;
_Collector_mectrics = new WeakMap(), _Collector_additional = new WeakMap(), _Collector_instances = new WeakSet(), _Collector_findLayers = function _Collector_findLayers(name, start, end, precision) {
    const result = [];
    let nextStart = start;
    for (let i = 0; i < __classPrivateFieldGet(this, _Collector_mectrics, "f")[name].length + 2; i++) {
        const lay = __classPrivateFieldGet(this, _Collector_instances, "m", _Collector_findLayer).call(this, name, nextStart, end, precision);
        result.push(lay);
        nextStart = lay.end;
        if (lay.end >= end)
            break;
    }
    return result;
}, _Collector_findLayer = function _Collector_findLayer(name, start, end, precision) {
    let layer = null;
    let layerIndex = 0;
    /*
     We're looking for the right layer to start with
     We will go from bottom to top until we find the layer we will enter from the beginning
    */
    for (let i = __classPrivateFieldGet(this, _Collector_mectrics, "f")[name].length; i > 0; i--) {
        layerIndex = i - 1;
        const ls = __classPrivateFieldGet(this, _Collector_mectrics, "f")[name][layerIndex];
        if (end < ls.layer.startTime || start > ls.layer.endTime)
            continue;
        if (start >= ls.layer.startTime && start < ls.layer.endTime) {
            layer = ls;
            break;
        }
    }
    if (layer !== null) {
        /*
            We have a layer, but we need to determine
            if there's a more appropriate layer with a higher accuracy.
            We'll go from top to bottom, and see if we can find a layer whose accuracy
            that's higher than the selected layer.
        */
        for (const ls of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name]) {
            // If the accuracy of the layer is less than we got
            // And we're capturing part of the layer
            if (ls.interval < layer.interval &&
                // precision < layer.precision && // suboptimally @todo
                end > ls.layer.startTime) {
                return { start, end: ls.layer.startTime, layer };
            }
        }
        // If there are no more candidates, we send what we have.
        // We need to check if the request is included in our layer completely
        if (end <= layer.layer.endTime)
            return { start, end, layer };
        return { start, end: layer.layer.endTime, layer };
    }
    else {
        // There is no suitable layer, there are two possibilities why this could be the case.
        // The first option is that we are at the beginning of our journey.
        // The second option is that we are at the end of our path.
        for (const ls of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name]) {
            if (start >= ls.layer.endTime)
                continue;
            if (end >= ls.layer.startTime)
                return { start, end: ls.layer.startTime, layer };
        }
    }
    return { start, end, layer: null };
}, _Collector_calcSize = function _Collector_calcSize(name) {
    if (!__classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
        throw ErrorManager_1.default.make('VDB_COLLECTOR_NOT_FOUND', { name });
    let res = 0;
    for (const lay of __classPrivateFieldGet(this, _Collector_mectrics, "f")[name])
        res += lay.layer.size();
    return res;
};
