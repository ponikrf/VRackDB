"use strict";
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
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
const ErrorManager_1 = __importDefault(require("./Errors/ErrorManager"));
const Interval_1 = __importDefault(require("./Interval"));
const Layer_1 = __importDefault(require("./Layer"));
const LayerStorage_1 = __importStar(require("./LayerStorage/LayerStorage"));
const Typing_1 = __importDefault(require("./Typing"));
ErrorManager_1.default.register('OM1Mt13G8WXA', 'VDB_COLLECTOR_METRIC_NAME', 'Not the correct name of the metric. Metric should contain Latin letters, numbers and dots (example `path.to.metric.2`)');
ErrorManager_1.default.register('5e6zb1eyDNdO', 'VDB_COLLECTOR_NOT_FOUND', 'Metric name not found, please init metric first');
ErrorManager_1.default.register('igUCOD5rJUKE', 'VDB_COLLECTOR_RETENTION_ZERO', 'At least one RETENTION must be specified.');
ErrorManager_1.default.register('sh0cmkHoXvpO', 'VDB_COLLECTOR_DUBLICATE', 'Metric name is exists in collector');
/**
 * Metrics initialization class
 *
 * Creates metrics based on retention settings.
 * The whole class works only with metrics and all its methods process only metrics.
 *
 * Metrics can be accessed by their identifier.
 * This identifier is set during initialization.
 * Then all operations are performed using the identifier of the metric.
 *
 * @link https://github.com/ponikrf/VRackDB/wiki/How-It-Works
*/
class Collector {
    constructor() {
        /**
         * Contains layers of metrics
         */
        this.mectrics = {};
        /**
         * Additional information for each metric
         *
         * firstTime - First time marker. Always filled with the earliest time
         * writeCount - Added each time a metric is written. Doesn't necessarily affect the data.
         * size - Metric size in bytes
         *
         * @see ICollectorMetricAdditional
        */
        this.additional = {};
    }
    /**
     * Initializes the metric store with `name` and the precision parameter `retentions`
     *
     * - `name` - Metric name in the graphite format (path.to.metric)
     * - `retentions` - Describes the layers of the collection, description like graphite carbon
     * of type 10s:1m where 10s is 10 seconds interval and 1m is 1 minute total period of the layer
     *
     * All types of intervals:
     *
     * - us - microsecond
     * - ms - millisecond
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
     * @example
     * ```ts
     * const collection = new Collector()
     * collection.init({ name: 'test.metric', retentions: '10s:1h, 1m:1d' })
     * ```
     * @see ICollectorOptions
    */
    init({ name, retentions, vStorage = null, tStorage = null, CInterval = Interval_1.default }) {
        if (!Typing_1.default.isName(name))
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_METRIC_NAME', { name });
        if (this.mectrics[name])
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_DUBLICATE', { name });
        const retArray = CInterval.retentions(retentions);
        LayerStorage_1.default.make(vStorage, LayerStorage_1.StorageTypes.Bit, 8);
        LayerStorage_1.default.make(tStorage, LayerStorage_1.StorageTypes.Bit, 8);
        if (!retArray.length)
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_RETENTION_ZERO');
        for (const ret of retArray) {
            const layer = new Layer_1.default({ interval: ret.interval, period: ret.period, vStorage, tStorage, CInterval });
            if (!this.mectrics[name])
                this.mectrics[name] = [];
            this.mectrics[name].push({
                layer, retention: ret.retention
            });
        }
        this.mectrics[name].sort((a, b) => {
            if (a.layer.period > b.layer.period)
                return -1;
            else if (a.layer.period < b.layer.period)
                return 1;
            return 0;
        });
        this.additional[name] = { writeCount: 0, firstTime: 0, size: this.calcSize(name) };
    }
    /**
     * Clears all metric data
     *
     * @param name metric name
    */
    clear(name) {
        if (!this.mectrics[name])
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_NOT_FOUND', { name });
        for (const lay of this.mectrics[name])
            lay.layer.clear();
    }
    /**
     * Returns the total size of the occupied memory in bytes Sums the sizes of all layers and returns the result
     *
     * @param {string} name Metric name
     * @return {number} Metric size in bytes
    */
    size(name) {
        if (!this.has(name, true))
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_NOT_FOUND', { name });
        return this.additional[name].size;
    }
    /**
     * Checks if the metric exists in the collection
     *
     * @param name Metric name
     * @param execption Throw exception if metric does not exist?
     * @returns {boolean}
    */
    has(name, execption = false) {
        if (execption && this.mectrics[name] === undefined)
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_NOT_FOUND', { name });
        if (this.mectrics[name] === undefined)
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
        if (!this.mectrics[name] === undefined)
            return;
        delete this.mectrics[name];
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
        this.has(name, true);
        if (time === 0)
            time = this.interval(name).now();
        if (this.additional[name].firstTime === 0 || this.additional[name].firstTime > time) {
            this.additional[name].firstTime = time;
        }
        for (const l of this.mectrics[name])
            l.layer.write(time, value, func);
        this.additional[name].writeCount++;
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
        this.has(name, true);
        // We need to find out what layer we're laying in
        start = this.interval(name).roundTime(start, precision);
        end = this.interval(name).roundTime(end, precision);
        const sLay = this.findLayers(name, start, end, precision);
        const result = {
            relevant: true, start, end, rows: []
        };
        for (const lay of sLay) {
            if (lay.layer === null) {
                const ils = this.interval(name).getIntervals(lay.start, lay.end, precision);
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
     * Returns irrelevant data, used when the requested metric does not exist
     *
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision in seconds
    */
    readFake(start, end, precision) {
        const iVls = Interval_1.default.getIntervals(start, end, precision);
        const result = { relevant: false, start, end, rows: [] };
        for (const iv of iVls)
            result.rows.push({ time: iv, value: null });
        return result;
    }
    /**
     * Returns the estimated start of the metric graph
     *
     * @param {string} name The name of the metric
    */
    start(name) {
        this.has(name, true);
        const lays = this.layers(name);
        if (this.additional[name].firstTime < lays[0].layer.startTime)
            return lays[0].layer.startTime;
        return this.additional[name].firstTime;
    }
    /**
     * Returns the estimated end of the metric graph
     *
     * @param {string} name The name of the metric
    */
    end(name) {
        this.has(name, true);
        const lays = this.layers(name);
        return lays[lays.length - 1].layer.endTime;
    }
    /**
     * Returns the number of writes count in the metric
     *
     * @param {string} name The name of the metric
    */
    writeCount(name) {
        this.has(name, true);
        return this.additional[name].writeCount;
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
        this.has(name, true);
        const result = [];
        for (const ls of this.mectrics[name])
            result.push(Object.assign({}, ls));
        return result;
    }
    /**
     * Return metric interval class
     *
     * @param {string} name The name of the metric
    */
    interval(name) {
        this.has(name, true);
        return this.mectrics[name][0].layer.CInterval;
    }
    /**
     * Return additional information
     *
     * @see ICollectorMetricAdditional
    */
    info(name) {
        this.has(name, true);
        return Object.assign({}, this.additional[name]);
    }
    /**
     * The method forms an array of layers and periods from which it is best to will take the necessary information.
     *
     * If, for example, there is a request whose time is not included in any layer, `
     * ILayerCollected` with layer `null` will be returned.
     *
     * Such periods are processed intervals with `null` values.
     *
     * @param {string} name Metric name
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision
     * @returns {Array<ILayerCollected>}
    */
    findLayers(name, start, end, precision) {
        const result = [];
        let nextStart = start;
        for (let i = 0; i < this.mectrics[name].length + 2; i++) {
            const lay = this.findLayer(name, nextStart, end, precision);
            result.push(lay);
            nextStart = lay.end;
            if (lay.end >= end)
                break;
        }
        return result;
    }
    /**
     * Searches the appropriate layer for the query, will search by time and accuracy
     *
     * @param {string} name Metric name
     * @param {number} start Beginning of the period
     * @param {number} end End of period
     * @param {number} precision Precision
     * @returns {ILayerCollected}
    */
    findLayer(name, start, end, precision) {
        let layer = null;
        let layerIndex = 0;
        /*
         We're looking for the right layer to start with
         We will go from bottom to top until we find the layer we will enter from the beginning
        */
        for (let i = this.mectrics[name].length; i > 0; i--) {
            layerIndex = i - 1;
            const ls = this.mectrics[name][layerIndex];
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
            for (const ls of this.mectrics[name]) {
                // If the accuracy of the layer is less than we got
                // And we're capturing part of the layer
                if (ls.layer.interval < layer.layer.interval &&
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
            // The MTU option is that we are at the end of our path.
            for (const ls of this.mectrics[name]) {
                if (start >= ls.layer.endTime)
                    continue;
                if (end >= ls.layer.startTime)
                    return { start, end: ls.layer.startTime, layer };
            }
        }
        return { start, end, layer: null };
    }
    /**
     * Calculates the size of the metric in bytes
     *
     * @param {string} name  metric name
    */
    calcSize(name) {
        if (!this.mectrics[name])
            throw ErrorManager_1.default.make(new Error, 'VDB_COLLECTOR_NOT_FOUND', { name });
        let res = 0;
        for (const lay of this.mectrics[name])
            res += lay.layer.length;
        return res;
    }
}
exports.default = Collector;
