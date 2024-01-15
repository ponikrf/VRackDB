/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import ErrorManager from "./Errors/ErrorManager";
import Interval from "./Interval";
import Layer, { IMetricReadResult } from "./Layer";
import { StorageTypes } from "./LayerStorage/LayerStorage";
import Typing from "./Typing";


/**
 * Describes the layer settings for storage and sorting
*/
export interface ILayerSettings {
    layer: Layer;
    interval: number;
    period: number;
    retention: string;
    vStorage: StorageTypes | null;
    tStorage: StorageTypes | null;
}

/**
 * Metrics layer storage object
*/
export interface IMetricCollector {
    [index: string]: Array<ILayerSettings>;
}

/**
 * Local interface to get a layer and its boundaries
*/
export interface ILayerCollected {
    start: number,
    end: number,
    layer: ILayerSettings | null
}


ErrorManager.register('OM1Mt13G8WXA', 'VDB_COLLECTOR_METRIC_NAME', 'Not the correct name of the metric. Metric should contain Latin letters, numbers and dots')
ErrorManager.register('5e6zb1eyDNdO', 'VDB_COLLECTOR_NOT_FOUND', 'Metric name not found, please init metric first')

/**
 * Metrics initialization class
 * @see /docs/Collector.md
*/
export default class Collector {

    /** 
     * Contains layers of metrics
     */
    #mectrics: IMetricCollector = {}

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
    init(name: string, retentions: string,  vStorage: StorageTypes | null = null, tStorage: StorageTypes | null = null) {
        if (!Typing.isName(name)) throw ErrorManager.make('VDB_COLLECTOR_METRIC_NAME', { name })
        const retArray = Interval.retentions(retentions)
        for (const ret of retArray) {
            const layer = new Layer(ret.interval, ret.period, vStorage, tStorage)
            if (!this.#mectrics[name]) this.#mectrics[name] = []
            this.#mectrics[name].push({
                layer, interval: ret.interval, period: ret.period, retention: ret.retention, vStorage, tStorage
            })
        }

        this.#mectrics[name].sort((a, b) => {
            if (a.layer.timeSize() > b.layer.timeSize()) return -1
            else if (a.layer.timeSize() < b.layer.timeSize()) return 1
            return 0
        })
    }

    /**
     * Clears all metric data
     * 
     * 
    */
    clear(name: string){
        if (!this.#mectrics[name]) throw ErrorManager.make('VDB_COLLECTOR_NOT_FOUND', { name })
        for (const lay of this.#mectrics[name]) lay.layer.clear()
    }

    /**
     * Returns layer settings for the specified metric
     * 
     * Modifying the layer settings doesn't make any sense, 
     * but modifying the layer buffer may cause it not to work.
     * 
     * @param {string} name Metric name
    */
    layers(name: string): Array<ILayerSettings>{
        if (!this.#mectrics[name]) throw ErrorManager.make('VDB_COLLECTOR_NOT_FOUND', { name })
        const result: Array<ILayerSettings>  = []
        for (const ls of this.#mectrics[name]) result.push(Object.assign({}, ls))
        return result
    }

    /**
     * Returns the total size of the occupied memory in bytes Sums the sizes of all layers and returns the result
     * 
     * @param {string} name Metric name
     * @return {number} Metric size in bytes
    */
    size(name: string): number {
        if (!this.#mectrics[name]) throw ErrorManager.make('VDB_COLLECTOR_NOT_FOUND', { name })
        let res = 0
        for (const lay of this.#mectrics[name]) res += lay.layer.size()
        return res
    }

    /**
     * Checks if the metric exists in the collection
     * 
     * @param {string} name Metric name
     * @returns {boolean}
    */
    has(name: string) : boolean {
        if (this.#mectrics[name] === undefined) return false
        return true
    }

    /**
     * Deletes links to the metric in an attempt to free up memory
     * should be aware that in this case no one should be referring to the 
     * metric layers, so it is strongly discouraged to use layers outside of
     * `Collector` or `Database`.
     * 
     * @param {string} name Metric name
    */
    destroy(name: string) {
        if (!this.#mectrics[name] === undefined) return
        delete this.#mectrics[name]
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
    write(name: string, value: number, time = 0, func = 'last') {
        if (time === 0) time = Math.floor(Date.now() / 1000)
        if (!this.#mectrics[name]) throw ErrorManager.make('VDB_COLLECTOR_NOT_FOUND', { name })
        for (const l of this.#mectrics[name]) l.layer.write(time, value, func)
    }

    /**
     * Reads data from the database from start to end  with precision
     * 
     * @param {string} name The name of the metric in graphite style
     * @param {number} start Timestamp of the beginning
     * @param {number} end End Timestamp
     * @param {string} precision The accuracy with which the response should be generated
    */
    read(name: string, start: number, end: number, precision: number, func = 'last'): IMetricReadResult {
        if (!this.#mectrics[name]) throw ErrorManager.make('VDB_COLLECTOR_NOT_FOUND', { name })
        // We need to find out what layer we're laying in
        start = Interval.roundTime(start, precision)
        end = Interval.roundTime(end, precision)
        const sLay = this.#findLayers(name, start, end, precision)
        const result: IMetricReadResult = {
            relevant: true, start, end, rows: []
        }
        for (const lay of sLay) {
            if (lay.layer === null) {
                const ils = Interval.getIntervals(lay.start, lay.end, precision)
                for (const time of ils) result.rows.push({ time, value: null })
                continue
            }
            const tres = lay.layer.layer.readCustomInterval(lay.start, lay.end, precision, func)
            for (const row of tres.rows) result.rows.push(row)
        }
        return result
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
    #findLayers(name: string, start: number, end: number, precision: number): Array<ILayerCollected> {
        const result: Array<ILayerCollected> = []
        let nextStart = start

        for (let i = 0; i < this.#mectrics[name].length + 2; i++) {
            const lay = this.#findLayer(name, nextStart, end, precision)
            result.push(lay)
            nextStart = lay.end
            if (lay.end >= end) break
        }
        return result
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
    #findLayer(name: string, start: number, end: number, precision: number): ILayerCollected {
        let layer: ILayerSettings | null = null;
        let layerIndex = 0
        /*
         We're looking for the right layer to start with
         We will go from bottom to top until we find the layer we will enter from the beginning
        */
        for (let i = this.#mectrics[name].length; i > 0; i--) {
            layerIndex = i - 1
            const ls: ILayerSettings = this.#mectrics[name][layerIndex]
            if (end < ls.layer.startTime || start > ls.layer.endTime) continue
            if (start >= ls.layer.startTime && start < ls.layer.endTime) {
                layer = ls; break;
            }
        }
        if (layer !== null) {
            /*
                We have a layer, but we need to determine 
                if there's a more appropriate layer with a higher accuracy.
                We'll go from top to bottom, and see if we can find a layer whose accuracy
                that's higher than the selected layer.
            */
            for (const ls of this.#mectrics[name]) {
                // If the accuracy of the layer is less than we got
                // And we're capturing part of the layer
                if (ls.interval < layer.interval &&
                    // precision < layer.precision && // suboptimally @todo
                    end > ls.layer.startTime
                ) {
                    return { start, end: ls.layer.startTime, layer }
                }
            }

            // If there are no more candidates, we send what we have.
            // We need to check if the request is included in our layer completely
            if (end <= layer.layer.endTime) return { start, end, layer }
            return { start, end: layer.layer.endTime, layer }
        } else {
            // There is no suitable layer, there are two possibilities why this could be the case.
            // The first option is that we are at the beginning of our journey.
            // The second option is that we are at the end of our path.
            for (const ls of this.#mectrics[name]) {
                if (start >= ls.layer.endTime) continue
                if (end >= ls.layer.startTime) return { start, end: ls.layer.startTime, layer }
            }
        }
        return { start, end, layer: null }
    }
}
